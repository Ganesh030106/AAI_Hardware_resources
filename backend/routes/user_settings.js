const express = require("express");
const router = express.Router();
const User = require("../model/users");
const bcrypt = require("bcrypt");

/**
 * POST /api/user-settings/change-password
 * Change user password
 */

router.post("/change-password", async (req, res) => {
    const { emp_id, currentPassword, newPassword } = req.body;

    if (!emp_id || !currentPassword || !newPassword) {
        return res.status(400).json({ message: "All fields required" });
    }

    const user = await User.findOne({ emp_id });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: "Current password incorrect" });
    }

    if (currentPassword === newPassword) {
        return res.status(400).json({
            message: "New password cannot be the same as old password"
        });
    }

    user.password = newPassword; // bcrypt via pre-save
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
});

module.exports = router;
