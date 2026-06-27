const express = require("express");
const router = express.Router();
const HardwareRequest = require("../model/HardwareRequest");
const Hardware = require("../model/hardware");
const User = require("../model/users");

// ==========================================
//      GET EXPORT DATA
// ==========================================
// GET /api/export/data?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/data", async (req, res) => {
	try {
		const { from, to } = req.query;

		// Build query filter
		let filter = {};

		// Support single-boundary ranges and use local start/end-of-day
		if (from || to) {
			let start = from ? new Date(`${from}T00:00:00`) : new Date("1970-01-01T00:00:00");
			let end = to ? new Date(`${to}T23:59:59.999`) : new Date();

			// Guard against invalid dates
			if (isNaN(start.getTime()) || isNaN(end.getTime())) {
				return res.status(400).json({ success: false, message: "Invalid date range." });
			}

			filter.order_date = { $gte: start, $lte: end };
		}

		// Fetch hardware requests
		const requests = await HardwareRequest.find(filter).sort({ order_date: -1 });

		// Enrich data with hardware names and user info
		const exportData = await Promise.all(
			requests.map(async (req) => {
				const hardware = await Hardware.findOne({ asset_id: req.asset_id });
				const user = await User.findOne({ emp_id: req.emp_id });

				return {
					request_id: req.request_id || "N/A",
					emp_id: req.emp_id || "N/A",
					emp_name: user ? user.name : "N/A",
					emp_dept: user ? user.dept : "N/A",
					asset_id: req.asset_id || "N/A",
					asset_name: hardware ? hardware.name : "N/A",
					quantity: req.quantity || 1,
					status: req.status || "N/A",
					order_date: req.order_date ? new Date(req.order_date).toLocaleDateString() : "N/A"
				};
			})
		);

		res.status(200).json({
			success: true,
			message: "Export data retrieved successfully",
			count: exportData.length,
			data: exportData
		});

	} catch (err) {
		console.error("❌ Error fetching export data:", err);
		res.status(500).json({
			success: false,
			message: "Server error while fetching export data",
			error: err.message
		});
	}
});

module.exports = router;
