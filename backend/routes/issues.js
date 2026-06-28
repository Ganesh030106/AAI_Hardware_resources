// ==========================================
//         ISSUE REQUESTS ROUTES
// ==========================================
// Provides issue request management for hardware problems reported by employees

const express = require("express");
const router = express.Router();
const IssueRequest = require("../model/IssueRequest");
const Hardware = require("../model/hardware");
const HardwareIssue = require("../model/HardwareIssue");
const User = require("../model/users");
const Attendance = require("../model/Attendance");
const Notification = require("../model/Notification");
const IssueComment = require("../model/IssueComment");

// ==========================================
//      GET ALL ISSUE REQUESTS WITH FILTERING
// ==========================================
// GET /api/issues?page=1&limit=5&search=&dept=&priority=
router.get("/", async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 5;
		const search = req.query.search || "";
		const dept = req.query.dept || "";
		const priority = req.query.priority || "";
		const skip = (page - 1) * limit;

		// Build filter object
		let filter = {};

		// Search filter - search across multiple fields
		if (search) {
			// First, find users matching name or department
			const matchingUsers = await User.find({
				$or: [
					{ name: { $regex: search, $options: "i" } },
					{ dept: { $regex: search, $options: "i" } }
				]
			});
			const matchingEmpIds = matchingUsers.map(u => u.emp_id);

			// Also find hardware matching the search
			const matchingHardware = await Hardware.find({
				$or: [
					{ name: { $regex: search, $options: "i" } },
					{ asset_id: { $regex: search, $options: "i" } }
				]
			});
			const matchingAssetIds = matchingHardware.map(h => h.asset_id);

			// Build the search filter
			filter.$or = [
				{ emp_id: { $in: matchingEmpIds } },
				{ asset_id: { $in: matchingAssetIds } },
				{ emp_id: { $regex: search, $options: "i" } },
				{ asset_id: { $regex: search, $options: "i" } },
				{ issue: { $regex: search, $options: "i" } }
			].filter(f => {
				const value = Object.values(f)[0];
				return value !== undefined && !(Array.isArray(value) && value.length === 0);
			});
		}

		// Department filter
		if (dept) {
			const deptUsers = await User.find({ dept: { $regex: `^${dept}$`, $options: "i" } });
			const deptEmpIds = deptUsers.map(u => u.emp_id);
			if (filter.$or) {
				filter = { $and: [{ $or: filter.$or }, { emp_id: { $in: deptEmpIds } }] };
				delete filter.$or;
			} else {
				filter.emp_id = { $in: deptEmpIds };
			}
		}

		// Priority filter
		if (priority) {
			if (filter.$and) {
				filter.$and.push({ priority: priority });
			} else if (filter.$or) {
				filter = { $and: [{ $or: filter.$or }, { priority: priority }] };
				delete filter.$or;
			} else {
				filter.priority = priority;
			}
		}

		// Fetch issues with pagination
		const issues = await IssueRequest.find(filter)
			.sort({ created_at: -1 })
			.skip(skip)
			.limit(limit);

		// Enrich with employee name, department, asset name, and hardware issue details
		const enrichedIssues = await Promise.all(
			issues.map(async (issue) => {
				const user = await User.findOne({ emp_id: issue.emp_id });
				const hardware = await Hardware.findOne({ asset_id: issue.asset_id });
				const hwIssue = await HardwareIssue.findOne({ issue: issue.issue, category: issue.category });

				return {
					_id: issue._id,
					emp_id: issue.emp_id,
					emp_name: user ? user.name : "Unknown",
					emp_dept: user ? user.dept : "Unknown",
					asset_id: issue.asset_id,
					asset_name: hardware ? hardware.name : "Unknown",
					category: issue.category,
					issue: issue.issue,
					priority: issue.priority,
					technician_status: issue.technician_status,
					description: issue.description,
					created_at: issue.created_at,
					aianalysis: issue.aianalysis || null
				};
			})
		);

		// Get total count for pagination
		const total = await IssueRequest.countDocuments(filter);

		res.json({
			issues: enrichedIssues,
			total: total,
			page: page,
			limit: limit
		});
	} catch (err) {
		console.error("❌ Error fetching issues:", err);
		res.status(500).json({ message: err.message });
	}
});

// ==========================================
//      GET FILTER OPTIONS FOR ISSUES
// ==========================================
// GET /api/issues/filter-options
router.get("/filter-options", async (req, res) => {
	try {
		// Get unique departments
		const depts = await User.distinct("dept");

		// Get unique priorities
		const priorities = await IssueRequest.distinct("priority");

		res.json({
			departments: depts || [],
			priorities: priorities || []
		});
	} catch (err) {
		console.error("❌ Error fetching filter options:", err);
		res.status(500).json({ message: err.message });
	}
});

// ==========================================
//      UPDATE ISSUE PRIORITY
// ==========================================
// PUT /api/issues/:id/priority
router.put("/:id/priority", async (req, res) => {
	try {
		const { priority } = req.body;
		const issue = await IssueRequest.findByIdAndUpdate(
			req.params.id,
			{ priority },
			{ new: true }
		);
		res.json(issue);
	} catch (err) {
		console.error("Error updating priority:", err);
		res.status(500).json({ message: err.message });
	}
});

// ==========================================
//      UPDATE ISSUE TECHNICIAN STATUS & ASSIGNMENT
// ==========================================
// PUT /api/issues/:id/technician-status
router.put("/:id/technician-status", async (req, res) => {
	try {
		const { technician_status, assigned_to } = req.body;
		
		const updateData = { technician_status };
		if (assigned_to !== undefined) {
			updateData.assigned_to = assigned_to;
		}

		const issue = await IssueRequest.findByIdAndUpdate(
			req.params.id,
			updateData,
			{ new: true }
		);

		// Log assignment notification for the technician
		if (assigned_to && (technician_status === 'assigned' || technician_status === 'Assigned')) {
			const hardware = await Hardware.findOne({ asset_id: issue.asset_id });
			const assetName = hardware ? hardware.name : issue.asset_id;

			const newNotification = new Notification({
				recipient_id: assigned_to,
				message: `You have been assigned a new maintenance request (ID: #${issue.request_id || issue._id}) for asset: ${assetName}.`
			});
			await newNotification.save();
		}

		res.json(issue);
	} catch (err) {
		console.error("Error updating technician status:", err);
		res.status(500).json({ message: err.message });
	}
});

// ==========================================
//      GET PRESENT TECHNICIANS FOR TODAY
// ==========================================
// GET /api/issues/technicians
router.get("/technicians", async (req, res) => {
	try {
		const todayStr = new Date().toISOString().split('T')[0];
		
		// Find technicians checked in today
		const presentLogs = await Attendance.find({ date: todayStr, status: "Present" });
		const presentTechIds = presentLogs.map(log => log.emp_id);

		const technicians = await User.find({
			role: "Technician",
			emp_id: { $in: presentTechIds }
		}).select("-password");

		res.json(technicians);
	} catch (err) {
		console.error("Error fetching present technicians:", err);
		res.status(500).json({ message: err.message });
	}
});

// ==========================================
//      TECHNICIAN: FETCH ASSIGNED TICKETS
// ==========================================
// GET /api/technician/issues
router.get("/technician/issues", async (req, res) => {
	try {
		const tech_id = req.query.tech_id;
		if (!tech_id) {
			return res.status(400).json({ message: "tech_id query parameter is required" });
		}

		const issues = await IssueRequest.find({ assigned_to: tech_id }).sort({ created_at: -1 });

		const enrichedIssues = await Promise.all(
			issues.map(async (issue) => {
				const user = await User.findOne({ emp_id: issue.emp_id });
				const hardware = await Hardware.findOne({ asset_id: issue.asset_id });
				return {
					_id: issue._id,
					emp_id: issue.emp_id,
					emp_name: user ? user.name : "Unknown",
					emp_dept: user ? user.dept : "Unknown",
					asset_id: issue.asset_id,
					asset_name: hardware ? hardware.name : "Unknown",
					category: issue.category,
					issue: issue.issue,
					priority: issue.priority,
					technician_status: issue.technician_status,
					description: issue.description,
					created_at: issue.created_at,
					aianalysis: issue.aianalysis || null
				};
			})
		);

		res.json(enrichedIssues);
	} catch (err) {
		console.error("Error fetching technician issues:", err);
		res.status(500).json({ message: err.message });
	}
});

// ==========================================
//      TECHNICIAN: UPDATE TICKET STATUS
// ==========================================
// PUT /api/technician/issues/:id/status
router.put("/technician/issues/:id/status", async (req, res) => {
	try {
		const { technician_status } = req.body;
		const issue = await IssueRequest.findByIdAndUpdate(
			req.params.id,
			{ technician_status },
			{ new: true }
		);
		res.json(issue);
	} catch (err) {
		console.error("Error updating technician issue status:", err);
		res.status(500).json({ message: err.message });
	}
});

// ==========================================
//      TECHNICIAN: GET ATTENDANCE STATUS
// ==========================================
// GET /api/technician/attendance/status
router.get("/technician/attendance/status", async (req, res) => {
	try {
		const { tech_id } = req.query;
		if (!tech_id) return res.status(400).json({ message: "tech_id is required" });

		const todayStr = new Date().toISOString().split('T')[0];
		const log = await Attendance.findOne({ emp_id: tech_id, date: todayStr });
		
		res.json({ checkedIn: log ? log.status === "Present" : false });
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

// ==========================================
//      TECHNICIAN: TOGGLE ATTENDANCE
// ==========================================
// POST /api/technician/attendance
router.post("/technician/attendance", async (req, res) => {
	try {
		const { tech_id, status } = req.body;
		if (!tech_id || !status) return res.status(400).json({ message: "tech_id and status are required" });

		const todayStr = new Date().toISOString().split('T')[0];
		const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

		const updateFields = { status };
		if (status === "Present") {
			updateFields.check_in_at = timeStr;
			updateFields.check_out_at = ""; // clear check-out on recheck-in
		} else {
			updateFields.check_out_at = timeStr;
		}

		const log = await Attendance.findOneAndUpdate(
			{ emp_id: tech_id, date: todayStr },
			updateFields,
			{ upsert: true, new: true }
		);

		res.json({ success: true, log });
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

// ==========================================
//      TECHNICIAN: GET UNREAD NOTIFICATIONS
// ==========================================
// GET /api/technician/notifications
router.get("/technician/notifications", async (req, res) => {
	try {
		const { tech_id } = req.query;
		if (!tech_id) return res.status(400).json({ message: "tech_id is required" });

		const notifications = await Notification.find({ recipient_id: tech_id, read: false }).sort({ created_at: -1 });
		res.json(notifications);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

// ==========================================
//      TECHNICIAN: MARK NOTIFICATIONS READ
// ==========================================
// PUT /api/technician/notifications/read
router.put("/technician/notifications/read", async (req, res) => {
	try {
		const { tech_id } = req.body;
		if (!tech_id) return res.status(400).json({ message: "tech_id is required" });

		await Notification.updateMany({ recipient_id: tech_id, read: false }, { read: true });
		res.json({ success: true });
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

// ==========================================
//      GET ISSUE STATISTICS (FOR CHARTS)
// ==========================================
// GET /api/issues/stats
router.get("/stats", async (req, res) => {
	try {
		// 1. Issues by Category (Top 5)
		const categoryStats = await IssueRequest.aggregate([
			{
				$group: {
					_id: "$category",
					count: { $sum: 1 }
				}
			},
			{ $sort: { count: -1 } },
			{ $limit: 5 }
		]);

		// 2. Issues by Priority
		const priorityStats = await IssueRequest.aggregate([
			{
				$group: {
					_id: { $toLower: "$priority" },
					count: { $sum: 1 }
				}
			}
		]);

		res.json({
			categoryStats,
			priorityStats
		});

	} catch (err) {
		console.error("❌ Issue Stats API Error:", err);
		res.status(500).json({ message: err.message });
	}
});

// ==========================================
//      TICKET COMMENTS ROUTES
// ==========================================
// GET /api/issues/:id/comments
router.get("/:id/comments", async (req, res) => {
	try {
		const comments = await IssueComment.find({ issue_id: req.params.id }).sort({ created_at: 1 });
		res.json(comments);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

// POST /api/issues/:id/comments
router.post("/:id/comments", async (req, res) => {
	try {
		const { author_id, author_name, author_role, comment } = req.body;
		if (!author_id || !author_name || !author_role || !comment) {
			return res.status(400).json({ message: "All comment fields are required" });
		}

		const newComment = new IssueComment({
			issue_id: req.params.id,
			author_id,
			author_name,
			author_role,
			comment
		});
		await newComment.save();

		// Log alerts
		const issue = await IssueRequest.findById(req.params.id);
		if (issue) {
			if (author_role === "Technician" && issue.emp_id) {
				const newNotif = new Notification({
					recipient_id: issue.emp_id,
					message: `Technician ${author_name} commented on ticket (ID: #${req.params.id.substring(req.params.id.length - 8).toUpperCase()}): "${comment.substring(0, 40)}${comment.length > 40 ? '...' : ''}"`
				});
				await newNotif.save();
			}
			if (author_role === "Employee" && issue.assigned_to) {
				const newNotif = new Notification({
					recipient_id: issue.assigned_to,
					message: `Employee ${author_name} commented on assigned ticket (ID: #${req.params.id.substring(req.params.id.length - 8).toUpperCase()}): "${comment.substring(0, 40)}${comment.length > 40 ? '...' : ''}"`
				});
				await newNotif.save();
			}
			if (author_role === "Admin" || author_role === "Superadmin") {
				const commentSnippet = `Admin ${author_name} commented on ticket (ID: #${req.params.id.substring(req.params.id.length - 8).toUpperCase()}): "${comment.substring(0, 40)}${comment.length > 40 ? '...' : ''}"`;
				if (issue.emp_id) {
					const newNotif = new Notification({
						recipient_id: issue.emp_id,
						message: commentSnippet
					});
					await newNotif.save();
				}
				if (issue.assigned_to) {
					const newNotif = new Notification({
						recipient_id: issue.assigned_to,
						message: commentSnippet
					});
					await newNotif.save();
				}
			}
		}

		res.status(201).json(newComment);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

// ==========================================
//      TECHNICIAN: GET ATTENDANCE HISTORY
// ==========================================
// GET /api/issues/technician/attendance/history
router.get("/technician/attendance/history", async (req, res) => {
	try {
		const { tech_id } = req.query;
		if (!tech_id) return res.status(400).json({ message: "tech_id is required" });

		const logs = await Attendance.find({ emp_id: tech_id }).sort({ date: -1 }).limit(30);
		res.json(logs);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

// ==========================================
//      ADMIN: LIVE OPERATIONS MONITOR
// ==========================================
// GET /api/issues/admin/live-ops
router.get("/admin/live-ops", async (req, res) => {
	try {
		const todayStr = new Date().toISOString().split('T')[0];
		const technicians = await User.find({ role: "Technician" }).select("-password").lean();

		const liveOpsData = await Promise.all(
			technicians.map(async (tech) => {
				const attendance = await Attendance.findOne({ emp_id: tech.emp_id, date: todayStr });
				const activeCount = await IssueRequest.countDocuments({
					assigned_to: tech.emp_id,
					technician_status: { $in: ["assigned", "In Progress"] }
				});
				const resolvedCount = await IssueRequest.countDocuments({
					assigned_to: tech.emp_id,
					technician_status: "Resolved"
				});

				return {
					emp_id: tech.emp_id,
					name: tech.name,
					username: tech.username,
					dept: tech.dept || "N/A",
					isPresent: attendance ? attendance.status === "Present" : false,
					check_in_at: attendance ? attendance.check_in_at : "",
					check_out_at: attendance ? attendance.check_out_at : "",
					activeCount,
					resolvedCount
				};
			})
		);

		res.json(liveOpsData);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

// ==========================================
//      ADMIN: DISPATCH ALERT TO TECHNICIAN
// ==========================================
// POST /api/issues/admin/dispatch-alert
router.post("/admin/dispatch-alert", async (req, res) => {
	try {
		const { tech_id, message } = req.body;
		if (!tech_id || !message) {
			return res.status(400).json({ message: "tech_id and message are required" });
		}

		const newNotification = new Notification({
			recipient_id: tech_id,
			message: `[ALERT] ${message}`
		});
		await newNotification.save();

		res.status(201).json({ success: true, notification: newNotification });
	} catch (err) {
		console.error("Error dispatching alert:", err);
		res.status(500).json({ message: err.message });
	}
});

// ==========================================
//      TECHNICIAN: PERFORMANCE STATS
// ==========================================
// GET /api/issues/technician/stats
router.get("/technician/stats", async (req, res) => {
	try {
		const { tech_id } = req.query;
		if (!tech_id) return res.status(400).json({ message: "tech_id is required" });

		const totalAssigned = await IssueRequest.countDocuments({ assigned_to: tech_id });
		const inProgress = await IssueRequest.countDocuments({ assigned_to: tech_id, technician_status: "In Progress" });
		const resolved = await IssueRequest.countDocuments({ assigned_to: tech_id, technician_status: "Resolved" });
		const checkIns = await Attendance.countDocuments({ emp_id: tech_id, status: "Present" });

		const totalDaysLogged = await Attendance.countDocuments({ emp_id: tech_id });
		const presentDays = await Attendance.countDocuments({ emp_id: tech_id, status: "Present" });
		
		const resolutionRate = totalAssigned > 0 ? (resolved / totalAssigned) : 0.85;
		const attendanceRate = totalDaysLogged > 0 ? (presentDays / totalDaysLogged) : 0.90;
		const efficiencyScore = Math.round((resolutionRate * 0.6 + attendanceRate * 0.4) * 100);

		const categoryChartData = await IssueRequest.aggregate([
			{ $match: { assigned_to: tech_id, technician_status: "Resolved" } },
			{ $group: { _id: "$category", count: { $sum: 1 } } }
		]);

		res.json({
			stats: {
				totalAssigned,
				inProgress,
				resolved,
				checkIns,
				efficiencyScore
			},
			categoryChartData
		});
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

module.exports = router;
