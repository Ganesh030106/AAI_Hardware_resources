// Express backend for user profile GET/PUT
const express = require('express');
const router = express.Router();
const User = require('../model/users');

// GET /api/profile?emp_id=...
router.get('/', async (req, res) => {
	const { emp_id } = req.query;
	if (!emp_id) return res.status(400).json({ message: 'emp_id required' });
	try {
		const user = await User.findOne({ emp_id, role: { $ne: 'admin' } }).lean();
		if (!user) return res.status(404).json({ message: 'User not found' });
		res.json(user);
	} catch (err) {
		res.status(500).json({ message: 'Server error' });
	}
});

// PUT /api/profile
router.put('/', async (req, res) => {
	const { emp_id, name, username, password, dept, role } = req.body;
	if (!emp_id) return res.status(400).json({ message: 'emp_id required' });
	try {
		const user = await User.findOneAndUpdate(
			{ emp_id, role: { $ne: 'admin' } },
			{ name, username, password, dept, role },
			{ new: true }
		).lean();
		if (!user) return res.status(404).json({ message: 'User not found' });
		res.json({ user });
	} catch (err) {
		res.status(500).json({ message: 'Server error' });
	}
});

module.exports = router;
