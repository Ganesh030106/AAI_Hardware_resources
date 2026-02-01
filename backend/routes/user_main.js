const express = require("express");
const router = express.Router();

// Models
const Allocation = require("../model/allocation");
const IssueRequest = require("../model/IssueRequest");
const HardwareIssue = require("../model/HardwareIssue");
const User = require("../model/users");
const Hardware = require("../model/hardware");

// GET /api/allocations/employee/:emp_id
router.get("/allocations/employee/:emp_id", async (req, res) => {
    try {
        const { emp_id } = req.params;

        const assets = await Allocation.find(
            { emp_id, status: { $regex: /^allocated$/i } },
            { asset_id: 1, _id: 0 }
        );

        return res.json(assets);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to fetch allocations" });
    }
});

// GET /api/hardware/asset/:assetId
router.get("/hardware/asset/:assetId", async (req, res) => {
    try {
        const { assetId } = req.params;
        const hardware = await Hardware.findOne({ asset_id: assetId });
        
        if (!hardware) {
            return res.status(404).json({ message: "Hardware not found" });
        }

        return res.json({
            name: hardware.name,
            model: hardware.model,
            asset_id: hardware.asset_id
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to fetch hardware details" });
    }
});

// GET /api/issues/categories
router.get("/issues/categories", async (_req, res) => {
    try {
        const categories = await HardwareIssue.distinct("category");
        return res.json(categories);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to load categories" });
    }
});

// GET /api/issues/by-category/:category
router.get("/issues/by-category/:category", async (req, res) => {
    try {
        const { category } = req.params;
        const issues = await HardwareIssue.find(
            { category },
            { issue: 1, priority: 1, _id: 0 }
        );
        return res.json(issues);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to load issues" });
    }
});

// POST /api/issuerequest
router.post("/issuerequest", async (req, res) => {
    try {
        const { emp_id, asset_id, category, issue, description } = req.body;

        if (!emp_id || !asset_id || !category || !issue) {
            return res.status(400).json({
                message: "emp_id, asset_id, category and issue are required"
            });
        }

        const allocation = await Allocation.findOne({
            emp_id,
            asset_id,
            status: { $regex: /^allocated$/i }
        });

        if (!allocation) {
            return res.status(403).json({ message: "Asset not allocated to this employee" });
        }

        const issueDoc = await HardwareIssue.findOne({ category, issue });
        if (!issueDoc) {
            return res.status(400).json({ message: "Invalid issue selected" });
        }

        const request = await IssueRequest.create({
            emp_id,
            asset_id,
            category,
            issue,
            priority: issueDoc.priority,
            description: description || ""
        });

        return res.status(201).json({
            message: "Request submitted successfully",
            request_id: request._id
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to submit request" });
    }
});

// POST /api/login
router.post("/login", async (req, res) => {
    try {
        const { username, password, role } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        const user = await User.findOne({ username, role });
        if (!user) {
            return res.status(401).json({ message: "Invalid username or role" });
        }

        if (user.password !== password) {
            return res.status(401).json({ message: "Incorrect password" });
        }

        return res.json({
            message: "Login successful",
            emp_id: user.emp_id,
            name: user.name,
            dept: user.dept,
            role: user.role
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Login failed" });
    }
});

module.exports = router;

