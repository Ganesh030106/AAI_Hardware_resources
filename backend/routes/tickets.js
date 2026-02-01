// ==========================================
//         TICKETS ROUTES
// ==========================================
// Provides ticket management for hardware requests and issues

const express = require("express");
const router = express.Router();
const HardwareRequest = require("../model/HardwareRequest");
const IssueRequest = require("../model/IssueRequest");
const Hardware = require("../model/hardware");
const HardwareIssue = require("../model/HardwareIssue");
const User = require("../model/users");

// Normalize various backend status values to UI-friendly labels
function normalizeStatus(status = "") {
    const value = String(status).toLowerCase();
    if (value === "rejected") return "Rejected";
    if (value === "completed" || value === "allocated") return "Allocated";
    return "Pending";
}

// ==========================================
//      GET ALL TICKETS WITH FILTERING
// ==========================================
// GET /api/tickets?page=1&limit=5&search=&dept=&status=
router.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const search = req.query.search || "";
        const dept = req.query.dept || "";
        const asset = req.query.asset || "";
        const skip = (page - 1) * limit;

        // Build filter object
        let filter = {};

        // Search filter - search across multiple fields including employee name and department
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
                { request_id: isNaN(search) ? undefined : parseInt(search) },
                { emp_id: { $in: matchingEmpIds } },
                { asset_id: { $in: matchingAssetIds } },
                { emp_id: { $regex: search, $options: "i" } }, // fallback for emp_id itself
                { asset_id: { $regex: search, $options: "i" } } // fallback for asset_id itself
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
                // Combine with existing search filter
                filter = { $and: [{ $or: filter.$or }, { emp_id: { $in: deptEmpIds } }] };
                delete filter.$or;
            } else {
                filter.emp_id = { $in: deptEmpIds };
            }
        }

        // Asset filter
        if (asset) {
            if (filter.$and) {
                filter.$and.push({ asset_id: asset });
            } else if (filter.$or) {
                filter = { $and: [{ $or: filter.$or }, { asset_id: asset }] };
                delete filter.$or;
            } else {
                filter.asset_id = asset;
            }
        }

        // Count total matching documents
        const total = await HardwareRequest.countDocuments(filter);

        // Fetch tickets with pagination
        const tickets = await HardwareRequest.find(filter)
            .sort({ order_date: -1 })
            .skip(skip)
            .limit(limit);

        // Enrich tickets with hardware names and user info
        const enrichedTickets = await Promise.all(
            tickets.map(async (ticket) => {
                const hardware = await Hardware.findOne({ asset_id: ticket.asset_id });
                const user = await User.findOne({ emp_id: ticket.emp_id });
                
                return {
                    ...ticket.toObject(),
                    asset_name: hardware ? hardware.name : "Unknown Asset",
                    emp_name: user ? user.name : "Unknown User",
                    emp_dept: user ? user.dept : "Unknown Dept"
                };
            })
        );

        res.json({
            tickets: enrichedTickets,
            total: total,
            page: page,
            limit: limit,
            pages: Math.ceil(total / limit)
        });

    } catch (err) {
        console.error("❌ Tickets API Error:", err);
        res.status(500).json({ message: err.message });
    }
});

// ==========================================
//      UPDATE TICKET STATUS
// ==========================================
// PUT /api/tickets/:id/status
router.put("/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        const ticket = await HardwareRequest.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        res.json(ticket);
    } catch (err) {
        console.error("Error updating status:", err);
        res.status(500).json({ message: err.message });
    }
});

// ==========================================
//      UPDATE TICKET PRIORITY
// ==========================================
// PUT /api/tickets/:id/priority
router.put("/:id/priority", async (req, res) => {
    try {
        const { priority } = req.body;
        // HardwareRequest doesn't have priority field, but keeping endpoint for compatibility
        res.json({ message: "Priority update not applicable for hardware requests" });
    } catch (err) {
        console.error("Error updating priority:", err);
        res.status(500).json({ message: err.message });
    }
});

// ==========================================
//      UPDATE TICKET ASSIGNMENT
// ==========================================
// PUT /api/tickets/:id/assignment
router.put("/:id/assignment", async (req, res) => {
    try {
        const { assigned } = req.body;
        // HardwareRequest doesn't have assigned field, keeping for compatibility
        res.json({ message: "Assignment update not applicable for hardware requests" });
    } catch (err) {
        console.error("Error updating assignment:", err);
        res.status(500).json({ message: err.message });
    }
});

// ==========================================
//      GET FILTER OPTIONS
// ==========================================
// GET /api/tickets/filter-options
router.get("/filter-options", async (req, res) => {
    try {
        // Get unique departments from users
        const users = await User.find({}, { dept: 1 });
        const departments = [...new Set(users.map(u => u.dept))].filter(d => d).sort();

        // Get unique statuses from HardwareRequest
        const requests = await HardwareRequest.find({}, { status: 1 });
        const statuses = [...new Set(requests.map(r => r.status))].sort();

        // Get all assets from Hardware
        const assets = await Hardware.find({}, { asset_id: 1, name: 1 }).sort({ name: 1 });

        res.json({
            departments,
            statuses,
            assets
        });
    } catch (err) {
        console.error("Error fetching filter options:", err);
        res.status(500).json({ message: err.message });
    }
});

// ==========================================
//      USER-SPECIFIC REQUESTS (MY REQUESTS)
// ==========================================
// GET /api/tickets/user/:emp_id
router.get("/user/:emp_id", async (req, res) => {
    try {
        const empId = req.params.emp_id;
        if (!empId) {
            return res.status(400).json({ message: "emp_id is required" });
        }

        const user = await User.findOne({ emp_id: empId }).lean();
        const requests = await HardwareRequest.find({ emp_id: empId }).sort({ order_date: -1 }).lean();

        const enriched = await Promise.all(
            requests.map(async (r) => {
                const hardware = await Hardware.findOne({ asset_id: r.asset_id }).lean();
                return {
                    request_id: r.request_id || String(r._id),
                    asset_id: r.asset_id,
                    asset_name: hardware ? hardware.name : "Unknown Asset",
                    department: user ? user.dept : "General",
                    priority: "Normal",
                    order_date: r.order_date,
                    status: normalizeStatus(r.status)
                };
            })
        );

        res.json(enriched);
    } catch (err) {
        console.error("❌ My Requests API Error:", err);
        res.status(500).json({ message: "Failed to load user requests" });
    }
});

// ==========================================
//      USER STATUS UPDATE (LIMITED)
// ==========================================
// PUT /api/tickets/:requestId/user-status
router.put("/:requestId/user-status", async (req, res) => {
    try {
        const { status, emp_id } = req.body;
        const requestIdParam = req.params.requestId;

        if (!emp_id) {
            return res.status(400).json({ message: "emp_id is required" });
        }

        // HardwareRequest uses numeric request_id; attempt numeric match first
        const numericId = parseInt(requestIdParam);
        const query = Number.isNaN(numericId)
            ? { _id: requestIdParam, emp_id }
            : { request_id: numericId, emp_id };

        const ticket = await HardwareRequest.findOne(query);
        if (!ticket) {
            return res.status(404).json({ message: "Request not found for this user" });
        }

        // Only allow toggling to Completed for hardware requests (maps to 'allocated')
        if (status === "Completed") {
            ticket.status = "allocated";
            await ticket.save();
            return res.json({ message: "Status updated", status: normalizeStatus(ticket.status) });
        }

        // Pending has no representation in hardware requests; reject gracefully
        return res.status(400).json({ message: "Pending status not applicable for this request type" });
    } catch (err) {
        console.error("❌ User status update error:", err);
        res.status(500).json({ message: "Failed to update status" });
    }
});

// ==========================================
//      GET TICKET STATISTICS (FOR CHARTS)
// ==========================================
// GET /api/tickets/stats
router.get("/stats", async (req, res) => {
    try {
        // 1. Status Distribution
        const statusStats = await HardwareRequest.aggregate([
            {
                $group: {
                    _id: { $toLower: "$status" },
                    count: { $sum: 1 }
                }
            }
        ]);

        // 2. Department Distribution
        // We need to look up the department from the 'users' collection using emp_id
        const deptStats = await HardwareRequest.aggregate([
            {
                $lookup: {
                    from: "users", // Ensure this matches your actual MongoDB collection name (usually lowercase plural)
                    localField: "emp_id",
                    foreignField: "emp_id",
                    as: "userDetails"
                }
            },
            { $unwind: "$userDetails" },
            {
                $group: {
                    _id: "$userDetails.dept",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 } // Top 5 departments
        ]);

        res.json({
            statusDistribution: statusStats,
            departmentDistribution: deptStats
        });

    } catch (err) {
        console.error("❌ Stats API Error:", err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;