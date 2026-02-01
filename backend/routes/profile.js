const express = require("express");
const router = express.Router();
const User = require("../model/users");
const Allocation = require("../model/allocation");

// ==========================================
//      GET USER PROFILE
// ==========================================
// GET /api/profile
router.get("/", async (req, res) => {
	try {
		const { emp_id } = req.query;

		// Validation
		if (!emp_id) {
			return res.status(400).json({
				message: "emp_id query parameter is required"
			});
		}

		// Find user by emp_id
		const user = await User.findOne({ emp_id });

		if (!user) {
			return res.status(404).json({
				message: "User not found"
			});
		}

		// Get user's allocated assets count
		const allocations = await Allocation.find({ 
			emp_id: emp_id,
			status: "Allocated"
		});

		res.status(200).json({
			success: true,
			message: "Profile retrieved successfully",
			data: {
				emp_id: user.emp_id,
				name: user.name,
				username: user.username,
				role: user.role,
				dept: user.dept,
				allocationCount: allocations.length,
				allocatedAssets: allocations.map(a => a.asset_id),
				lastLogin: new Date().toLocaleString()
			}
		});

	} catch (err) {
		console.error("❌ Error fetching profile:", err);
		res.status(500).json({
			success: false,
			message: "Server error while fetching profile",
			error: err.message
		});
	}
});

// ==========================================
//      GET USER PROFILE BY IDENTIFIER
// ==========================================
// GET /api/profile/:identifier (username or emp_id)
router.get("/:identifier", async (req, res) => {
	try {
		const { identifier } = req.params;

		// Try to find by emp_id first, then by username
		let user = await User.findOne({ emp_id: identifier });
		
		if (!user) {
			user = await User.findOne({ username: identifier });
		}

		if (!user) {
			return res.status(404).json({
				message: "User not found"
			});
		}

		// Get user's allocated assets count
		const allocations = await Allocation.find({ 
			emp_id: user.emp_id,
			status: "Allocated"
		});

		res.status(200).json({
			success: true,
			message: "Profile retrieved successfully",
			data: {
				emp_id: user.emp_id,
				name: user.name,
				username: user.username,
				role: user.role,
				dept: user.dept,
				allocationCount: allocations.length,
				allocatedAssets: allocations.map(a => a.asset_id),
				lastLogin: new Date().toLocaleString()
			}
		});

	} catch (err) {
		console.error("❌ Error fetching profile:", err);
		res.status(500).json({
			success: false,
			message: "Server error while fetching profile",
			error: err.message
		});
	}
});

module.exports = router;
