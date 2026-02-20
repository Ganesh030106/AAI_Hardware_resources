const express = require('express');
const router = express.Router();
const User = require('../model/users'); // Import your schema

// POST: /api/superadmin/login
router.post('/superadminlogin', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "Invalid Credentials" });
        }

        // 2. Check Password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid Credentials" });
        }

        // 3. SAFER Role Check (Prevents crash if role is missing)
        if (!user.role || user.role.toLowerCase() !== 'superadmin') {
            return res.status(403).json({ message: "Invalid Credentials" });
        }

        // 4. REMOVED the "req.session" line that was causing the 500 error.
        // We will send the user info to the browser instead.

        res.status(200).json({
            message: "Login Successful",
            redirectUrl: "/superadminDash.html",
            // Send user data so the frontend can save it
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });

    } catch (err) {
        console.error("Login Error:", err); // Now you can see errors in terminal
        res.status(500).json({ message: "Server Error" });
    }
});


// POST /user-login - Regular user login (non-admin)
router.post('/user-login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // 1. Check if the user exists
        const user = await User.findOne({ username: username });

        if (!user) {
            console.log("User Login failed: User not found");
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid password" });
        }


        // 3. Validate Role (Reject admin users - they should use admin login)
        if (user.role.toLowerCase() === 'admin') {
            return res.status(403).json({ success: false, message: "Invalid Credentials" });
        }

        console.log("User Login successful for user:", username);
        // 4. Success Response
        res.json({
            success: true,
            message: "Login Successful",
            user: {
                name: user.name,
                role: user.role,
                emp_id: user.emp_id,
                username: user.username,
                dept: user.dept
            }
        });

    } catch (error) {
        console.log("User Login Error:");
        console.error("User Login Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// POST /login - Admin login only
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // 1. Check if the user exists
        const user = await User.findOne({ username: username });

        console.log("Attempting login for user:", username);
        console.log("User found:", user ? "Yes" : "No");

        if (!user) {
            console.log("Login failed: User not found");
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid password" });
        }


        if (user.role.toLowerCase() !== 'admin') {
            return res.status(403).json({ success: false, message: "Invalid Credentials" });
        }

        console.log("Login successful for user:", username);
        // 4. Success Response
        res.json({
            success: true,
            message: "Login Successful",
            user: {
                emp_id: user.emp_id,
                name: user.name,
                role: user.role,
                username: user.username
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// GET /users/:emp_id - Fetch user details by employee ID
router.get('/users/:emp_id', async (req, res) => {
    try {
        const user = await User.findOne({ emp_id: req.params.emp_id });

        if (!user) {
            console.log("User not found for emp_id:", req.params.emp_id);
            return res.status(404).json({ message: "User not found" });
        }

        console.log("User details fetched for emp_id:", req.params.emp_id);
        // Return user details (without password)
        res.json({
            emp_id: user.emp_id,
            name: user.name,
            role: user.role,
            dept: user.dept,
            username: user.username
        });

    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Server error" });
    }
});


// ==========================================
// SUPER ADMIN DASHBOARD API ROUTES
// ==========================================

// 1. GET ALL USERS (Populates the Dashboard Table)
router.get('/superadmin/users', async (req, res) => {
    try {
        // Fetch all users except superadmin, hide their passwords
        const users = await User.find({ role: { $ne: 'SuperAdmin' } }).select('-password');
        res.status(200).json(users);
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ message: "Server Error" });
    }
});

// 2. UPDATE USER ROLE (Promote/Demote)
router.patch('/superadmin/update-role/:id', async (req, res) => {
    try {
        const { role } = req.body;
        const userId = req.params.id;

        // Find user by MongoDB _id and update their role
        await User.findByIdAndUpdate(userId, { role: role });

        res.status(200).json({ message: "Role updated successfully" });
    } catch (err) {
        console.error("Error updating role:", err);
        res.status(500).json({ message: "Server Error" });
    }
});

// 3. DELETE USER
router.delete('/superadmin/delete/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        // Delete user by MongoDB _id
        await User.findByIdAndDelete(userId);

        res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).json({ message: "Server Error" });
    }
});

// POST: /api/reset-password
// Reset password by providing Username OR Employee ID
router.post('/reset-password', async (req, res) => {
    try {
        const { identifier, newPassword } = req.body;

        // 1. Validation
        if (!identifier || !newPassword) {
            return res.status(400).json({ message: "Please provide ID/Username and a new password" });
        }

        // 2. Find User (Checks both 'username' AND 'emp_id')
        const user = await User.findOne({
            $or: [
                { username: identifier },
                { emp_id: identifier }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: "User not found with that Username or Employee ID" });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters long" });
        }

        // 3. Update Password
        // We set the property directly. The Schema's pre('save') hook will automatically hash it.
        user.password = newPassword;
        await user.save();

        res.status(200).json({
            message: `Password successfully updated for ${user.username} (${user.role})`
        });

    } catch (err) {
        console.error("Reset Password Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
});

// FRONTEND AUTH HELPERS
function requireSuperAdmin() {
    const sa = JSON.parse(sessionStorage.getItem('superadmin_user'));
    if (!sa || sa.role.toLowerCase() !== 'superadmin') {
        window.location.href = '/SuperAdminLogin.html';
    }
}

// Add this inside your API routes configuration
// IF YOU ARE USING EXPRESS ROUTER (likely in routes/superAdmin.js):
router.patch('/superadmin/update-details/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, emp_id, dept, username } = req.body;

        // "User" should be your MongoDB Model name
        const updatedUser = await User.findByIdAndUpdate(id, {
            name,
            emp_id,
            dept,
            username
        }, { new: true }); // {new: true} returns the updated document

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User details updated successfully", user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error updating details" });
    }
});

/* NOTE: If you are putting this directly in server.js instead of a router file, 
   change "router.patch" to "app.patch" and ensure the path 
   matches the full URL: '/api/superadmin/update-details/:id' 
*/

// ==========================================
// ADD NEW USER (Superadmin: Add Employee/Admin)
// ==========================================
// POST /superadmin/add-user
router.post('/superadmin/add-user', async (req, res) => {
    try {
        const { name, emp_id, dept, username, password, role } = req.body;

        // Validate required fields
        if (!name || !emp_id || !dept || !username || !password || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Only allow Employee or Admin
        if (!['Employee', 'Admin'].includes(role)) {
            return res.status(400).json({ message: "Role must be 'Employee' or 'Admin'" });
        }

        // Check for duplicate emp_id or username
        const existing = await User.findOne({ $or: [ { emp_id }, { username } ] });
        if (existing) {
            return res.status(409).json({ message: "User with this Employee ID or Username already exists" });
        }

        if (password.length < 8) {  
            return res.status(400).json({ message: "Password must be at least 8 characters long" });
        }

        // Create and save new user
        const newUser = new User({ name, emp_id, dept, username, password, role });
        await newUser.save();

        res.status(201).json({ message: "User created successfully", user: {
            name: newUser.name,
            emp_id: newUser.emp_id,
            dept: newUser.dept,
            username: newUser.username,
            role: newUser.role
        }});
    } catch (error) {
        console.error("Add User Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;

