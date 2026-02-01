// ==========================================
//         USER DASHBOARD ROUTES
// ==========================================
// Provides per-user stats and recent activity for the user dashboard

const express = require("express");
const router = express.Router();

const HardwareRequest = require("../model/HardwareRequest");
const Hardware = require("../model/hardware");

// Map stored statuses to user-friendly values expected by the UI chips
function normalizeStatus(status = "") {
	const value = status.toLowerCase();
	if (value === "rejected") return "Rejected";
	if (value === "completed" || value === "allocated") return "Completed";
	if (value === "approved") return "Approved";
	if (value === "in progress") return "In Progress";
	return "Pending";
}

// ==========================================
//      USER STATS (TOTAL/PENDING/DONE)
// ==========================================
// GET /api/user/dashboard/stats?emp_id=E123
router.get("/stats", async (req, res) => {
	try {
		const empId = req.query.emp_id;

		if (!empId) {
			return res.status(400).json({ message: "emp_id query parameter is required" });
		}

		const requests = await HardwareRequest.find({ emp_id: empId }).lean();

		const total = requests.length;
		const completed = requests.filter((r) => /^(completed|allocated)$/i.test(r.status || "")).length;
		const rejected = requests.filter((r) => /^(rejected)$/i.test(r.status || "")).length;

		res.json({
			total,
			rejected,
			completed
		});
	} catch (err) {
		console.error("❌ User dashboard stats error:", err);
		res.status(500).json({ message: "Failed to load user stats" });
	}
});

// ==========================================
//      RECENT ACTIVITY (LATEST 5)
// ==========================================
// GET /api/user/dashboard/activity?emp_id=E123
router.get("/activity", async (req, res) => {
	try {
		const empId = req.query.emp_id;

		if (!empId) {
			return res.status(400).json({ message: "emp_id query parameter is required" });
		}

		const requests = await HardwareRequest.find({ emp_id: empId })
			.sort({ order_date: -1 })
			.limit(5)
			.lean();

		const activity = await Promise.all(
			requests.map(async (reqDoc) => {
				const hardware = await Hardware.findOne({ asset_id: reqDoc.asset_id }).lean();

				   return {
					   request_id: reqDoc.request_id || reqDoc._id,
					   asset_id: reqDoc.asset_id,
					   asset_name: hardware ? hardware.name : "Unknown",
					   quantity: reqDoc.quantity || 1,
					   status: normalizeStatus(reqDoc.status),
					   order_date: reqDoc.order_date || new Date()
				   };
			})
		);

		res.json(activity);
	} catch (err) {
		console.error("❌ User dashboard activity error:", err);
		res.status(500).json({ message: "Failed to load recent activity" });
	}
});

module.exports = router;
