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
//      UPDATE ISSUE TECHNICIAN STATUS
// ==========================================
// PUT /api/issues/:id/technician-status
router.put("/:id/technician-status", async (req, res) => {
	try {
		const { technician_status } = req.body;
		const issue = await IssueRequest.findByIdAndUpdate(
			req.params.id,
			{ technician_status },
			{ new: true }
		);
		res.json(issue);
	} catch (err) {
		console.error("Error updating technician status:", err);
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
//      AI ANALYSIS ENDPOINT (RULE-BASED)
// ==========================================
// POST /api/issues/:id/aianalysis
router.post("/:id/aianalysis", async (req, res) => {
	try {
		const issue = await IssueRequest.findById(req.params.id);
		if (!issue) return res.status(404).json({ message: "Issue not found" });

		// Rule-based protocol for AI analysis
		let aiPriority = "Low";
		let aiRecommendation = "Review";
		let aiReason = "";

		// Example rules (customize as needed):
		// High priority if: HR or OPERATIONS dept and High/Medium severity issue
		// Medium if: category is Desktop/Laptop and issue is critical
		// Otherwise Low

		// Fetch user for dept
		const user = await User.findOne({ emp_id: issue.emp_id });
		const dept = user ? (user.dept || "").toUpperCase() : "";
		const issueText = (issue.issue || "").toLowerCase();
		const category = (issue.category || "").toLowerCase();

		if ((dept === "HR" || dept === "OPERATIONS") && (issue.priority === "High" || issue.priority === "Medium")) {
			aiPriority = "High";
			aiRecommendation = "Review";
			aiReason = "Issue impacts critical department and requires admin attention.";
		} else if (category.includes("desktop") || category.includes("laptop")) {
			if (issueText.includes("bsod") || issueText.includes("overheating") || issueText.includes("critical")) {
				aiPriority = "Medium";
				aiRecommendation = "Assign technician";
				aiReason = "Device issue may impact productivity; technician assignment recommended.";
			}
		} else if (issue.priority === "High") {
			aiPriority = "High";
			aiRecommendation = "Review";
			aiReason = "Marked as high priority by user.";
		} else {
			aiPriority = "Low";
			aiRecommendation = "Monitor";
			aiReason = "No critical impact detected.";
		}

		// Update the issue with AI analysis
		issue.aianalysis = {
			priority: aiPriority,
			recommendation: aiRecommendation,
			reason: aiReason
		};
		await issue.save();

		res.json({
			aianalysis: issue.aianalysis,
			message: "AI analysis completed and saved."
		});
	} catch (err) {
		console.error("AI Analysis error:", err);
		res.status(500).json({ message: err.message });
	}
});

module.exports = router;
