// ==========================================
//      USER ISSUE REQUESTS ROUTES
// ==========================================
// Provides issue request management for users

const express = require("express");
const router = express.Router();
const IssueRequest = require("../model/IssueRequest");
const Hardware = require("../model/hardware");
const User = require("../model/users");
const Technician = require("../model/users"); // Assume technicians are also in users collection

// ==========================================
//      GET USER'S ISSUE REQUESTS
// ==========================================
// GET /api/issue-requests/user/:emp_id
router.get("/user/:emp_id", async (req, res) => {
    try {
        const empId = req.params.emp_id;
        if (!empId) {
            return res.status(400).json({ message: "emp_id is required" });
        }

        // Fetch user info for department
        const user = await User.findOne({ emp_id: empId }).lean();

        // Fetch all issue requests for this user
        const requests = await IssueRequest.find({ emp_id: empId })
            .sort({ created_at: -1 })
            .lean();

        // Enrich with hardware name and technician name
        const enriched = await Promise.all(
            requests.map(async (req) => {
                const hardware = await Hardware.findOne({ asset_id: req.asset_id }).lean();

                // Determine technician name based on status
                let technicianName = "Unassigned";
                if (req.technician_status === "assigned") {
                    if (req.technician_id) {
                        const tech = await User.findOne({ emp_id}).lean();
                        technicianName = tech ? tech.name : "Assigned";
                    } else {
                        technicianName = "Assigned";
                    }
                }

                return {
                    request_id: req._id || String(req._id),
                    emp_id: req.emp_id,
                    asset_id: req.asset_id,
                    asset_name: hardware ? hardware.name : "Unknown Asset",
                    category: req.category || "General",
                    issue: req.issue || "No issue description",
                    priority: req.priority || "Pending",
                    description: req.description || "",
                    created_at: req.created_at || new Date(),
                    technician_status: req.technician_status || "Unassigned",
                    technician_name: technicianName,
                    department: user ? user.dept : "General"
                };
            })
        );

        res.json(enriched);
    } catch (err) {
        console.error("❌ User Issue Requests API Error:", err);
        res.status(500).json({ message: "Failed to load user issue requests" });
    }
});

// ==========================================
//      GET ALL ISSUE REQUESTS (Admin)
// ==========================================
// GET /api/issue-requests
router.get("/", async (req, res) => {
    try {
        const requests = await IssueRequest.find().sort({ created_at: -1 }).lean();

        // Enrich with hardware and user details
        const enriched = await Promise.all(
            requests.map(async (req) => {
                const hardware = await Hardware.findOne({ asset_id: req.asset_id }).lean();
                const requester = await User.findOne({ emp_id: req.emp_id }).lean();

                let technicianName = "Unassigned";
                if (req.technician_status === "assigned") {
                    if (req.technician_id) {
                        const tech = await User.findOne({ emp_id: req.technician_id }).lean();
                        technicianName = tech ? tech.name : "Assigned";
                    } else {
                        technicianName = "Assigned";
                    }
                }

                return {
                    request_id: req._id || String(req._id),
                    emp_id: req.emp_id,
                    emp_name: requester ? requester.name : "Unknown User",
                    asset_id: req.asset_id,
                    asset_name: hardware ? hardware.name : "Unknown Asset",
                    category: req.category || "General",
                    issue: req.issue || "No issue description",
                    priority: req.priority || "Pending",
                    description: req.description || "",
                    created_at: req.created_at || new Date(),
                    technician_status: req.technician_status || "Unassigned",
                    technician_name: technicianName,
                    department: requester ? requester.dept : "General"
                };
            })
        );

        res.json(enriched);
    } catch (err) {
        console.error("❌ Issue Requests API Error:", err);
        res.status(500).json({ message: "Failed to load issue requests" });
    }
});

// ==========================================
//      GET SINGLE ISSUE REQUEST
// ==========================================
// GET /api/issue-requests/:id
router.get("/:id", async (req, res) => {
    try {
        const request = await IssueRequest.findById(req.params.id).lean();
        if (!request) {
            return res.status(404).json({ message: "Issue request not found" });
        }

        const hardware = await Hardware.findOne({ asset_id: request.asset_id }).lean();
        const requester = await User.findOne({ emp_id: request.emp_id }).lean();

        let technicianName = "Unassigned";
        if (request.technician_status === "assigned") {
            if (request.technician_id) {
                const tech = await User.findOne({ emp_id: request.technician_id }).lean();
                technicianName = tech ? tech.name : "Assigned";
            } else {
                technicianName = "Assigned";
            }
            let technicianName = "Unassigned";
            if (request.technician_status === "assigned" && request.technician_id) {
                const tech = await User.findOne({ emp_id: request.technician_id }).lean();
                technicianName = tech ? tech.name : "Unknown Technician";
            }

            res.json({
                request_id: request._id,
                emp_id: request.emp_id,
                emp_name: requester ? requester.name : "Unknown User",
                asset_id: request.asset_id,
                asset_name: hardware ? hardware.name : "Unknown Asset",
                category: request.category,
                issue: request.issue,
                priority: request.priority,
                description: request.description,
                created_at: request.created_at,
                technician_status: request.technician_status,
                technician_name: technicianName,
                department: requester ? requester.dept : "General"
            });
        }
    } catch (err) {
        console.error("❌ Issue Request Detail API Error:", err);
        res.status(500).json({ message: "Failed to load issue request" });
    }
});

// ==========================================
//      CREATE ISSUE REQUEST
// ==========================================
// POST /api/issue-requests
router.post("/", async (req, res) => {
    try {
        const { emp_id, asset_id, category, issue, priority, description } = req.body;

        if (!emp_id || !asset_id || !category || !issue) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const newRequest = new IssueRequest({
            emp_id,
            asset_id,
            category,
            issue,
            priority: priority || "Pending",
            description: description || "",
            technician_status: "Unassigned"
        });

        await newRequest.save();

        res.status(201).json({
            message: "Issue request created successfully",
            request_id: newRequest._id,
            request: newRequest
        });
    } catch (err) {
        console.error("❌ Create Issue Request Error:", err);
        res.status(500).json({ message: "Failed to create issue request" });
    }
});

// ============================================
//         UPDATE ISSUE REQUEST (Admin)
// ============================================
// PUT /api/issue-requests/:id
router.put("/:id", async (req, res) => {
    try {
        const { priority, technician_status, technician_id, description } = req.body;
        const updateData = {};

        if (priority) updateData.priority = priority;
        if (technician_status) updateData.technician_status = technician_status;
        if (technician_id) updateData.technician_id = technician_id;
        if (description !== undefined) updateData.description = description;

        const updatedRequest = await IssueRequest.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updatedRequest) {
            return res.status(404).json({ message: "Issue request not found" });
        }

        res.json({
            message: "Issue request updated successfully",
            request: updatedRequest
        });
    } catch (err) {
        console.error("❌ Update Issue Request Error:", err);
        res.status(500).json({ message: "Failed to update issue request" });
    }
});

// ==========================================
//      DELETE ISSUE REQUEST
// ==========================================
// DELETE /api/issue-requests/:id
router.delete("/:id", async (req, res) => {
    try {
        const deletedRequest = await IssueRequest.findByIdAndDelete(req.params.id);

        if (!deletedRequest) {
            return res.status(404).json({ message: "Issue request not found" });
        }

        res.json({
            message: "Issue request deleted successfully",
            request_id: deletedRequest._id
        });
    } catch (err) {
        console.error("❌ Delete Issue Request Error:", err);
        res.status(500).json({ message: "Failed to delete issue request" });
    }
});

module.exports = router;
