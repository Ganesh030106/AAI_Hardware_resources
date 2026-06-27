const express = require("express");
const router = express.Router();
const User = require("../model/users");
const bcrypt = require("bcrypt");
// ==========================================
//      POST CHANGE PASSWORD
// ==========================================
// POST /api/settings/change-password


router.post("/change-password", async (req, res) => {
	const { identifier, newPassword } = req.body;

	if (!identifier || !newPassword) {
		return res.status(400).json({ message: "Missing fields" });
	}

	let user = await User.findOne({ username: identifier })
		|| await User.findOne({ emp_id: identifier });

	if (!user) {
		return res.status(404).json({ message: "User not found" });
	}
	// CHECK: New password must not be old password
	const isSamePassword = await bcrypt.compare(newPassword, user.password);

	if (isSamePassword) {
		return res.status(400).json({
			message: "New password cannot be the same as old password"
		});
	}

	else {
		console.log(`Changing password for user: ${user.username} (ID: ${user.emp_id})`);
		user.password = newPassword; // bcrypt via pre-save hook
		await user.save();

		res.json({ message: "Password Updated successfully" });
	}
});

// ==========================================
//	  POST ADMIN USER CHANGE PASSWORD
// ==========================================
router.post("/user-change-password", async (req, res) => {
	const { identifier, newPassword } = req.body;

	if (!identifier || !newPassword) {
		return res.status(400).json({ message: "Missing fields" });
	}

	// Prevent identifier from being 'admin' (case-insensitive)
	if (identifier.toLowerCase() === 'admin') {
		return res.status(403).json({ message: "Cannot reset password for admin user" });
	}
	else {

		let user = await User.findOne({ username: identifier })
			|| await User.findOne({ emp_id: identifier });

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		if (user.role && user.role.toLowerCase() === 'admin') {
			return res.status(403).json({ message: "Admins cannot reset other admins' passwords" });
		}
		// CHECK: New password must not be old password
		const isSamePassword = await bcrypt.compare(newPassword, user.password);

		if (isSamePassword) {
			return res.status(400).json({
				message: "New password cannot be the same as old password"
			});
		}
		else {
			console.log(`Admin changing password for user: ${user.username} (ID: ${user.emp_id})`);

			user.password = newPassword; // bcrypt via pre-save hook
			await user.save();

			res.json({ message: " User Password Updated successfully" });
		}
	}
});

// ==========================================
//   POST VALIDATE USER (ADMIN)
// ==========================================
router.post("/validate-user", async (req, res) => {
	const { identifier } = req.body;

	if (!identifier) {
		return res.status(400).json({ message: "Employee ID required" });
	}

	const user = await User.findOne({ emp_id: identifier });

	if (!user) {
		return res.status(404).json({ message: "Employee not found" });
	}

	if (user.role && user.role.toLowerCase() === "admin") {
		return res.status(403).json({ message: "Admin users cannot be modified" });
	}

	res.json({ message: "Employee ID valid" });
});


module.exports = router;
