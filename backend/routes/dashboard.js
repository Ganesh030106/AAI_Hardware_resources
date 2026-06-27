
// ==========================================
//         DASHBOARD ROUTES
// ==========================================
const express = require("express");
const router = express.Router();
const HardwareRequest = require("../model/HardwareRequest");
const Hardware = require("../model/hardware");
const User = require("../model/users");

// ==========================================
//      DASHBOARD STATISTICS ENDPOINT
// ==========================================
router.get("/stats", async (req, res) => {
    try {
        // 1. Basic Counters
        const totalRequests = await HardwareRequest.countDocuments();
        const pendingRequests = await HardwareRequest.countDocuments({ status: { $regex: /^pending$/i } });
        const rejectedRequests = await HardwareRequest.countDocuments({ status: { $regex: /^rejected$/i } });
        const allocatedRequests = await HardwareRequest.countDocuments({ status: { $regex: /^allocated$/i } });

        // 2. Recent Activity (Last 5)
        const recentRequests = await HardwareRequest.find().sort({ order_date: -1 }).limit(5);

        // 3. Chart Data: Top 5 Requested Assets
        const topAssetsRaw = await HardwareRequest.aggregate([
            { $group: { _id: "$asset_id", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // 4. Chart Data: Status Distribution
        // Group by status (case insensitive normalized)
        const statusDistribution = await HardwareRequest.aggregate([
            {
                $group: {
                    _id: { $toLower: "$status" },
                    count: { $sum: 1 }
                }
            }
        ]);

        // --- Data Enrichment (Join Names) ---
        
        // Collect IDs for lookup
        const empIds = recentRequests.map(r => r.emp_id);
        const assetIds = [...recentRequests.map(r => r.asset_id), ...topAssetsRaw.map(t => t._id)];

        // Parallel DB Fetch
        const [users, hardwares] = await Promise.all([
            User.find({ emp_id: { $in: empIds } }),
            Hardware.find({ asset_id: { $in: assetIds } })
        ]);

        // Create Lookup Maps
        const userMap = {};
        users.forEach(u => userMap[u.emp_id] = u.name);

        const hardwareMap = {};
        hardwares.forEach(h => {
    hardwareMap[h.asset_id] = `${h.name} - ${h.model}`;});


        // Enrich Recent Requests
        const enrichedRequests = recentRequests.map(req => ({
            ...req.toObject(),
            asset_name: hardwareMap[req.asset_id] || req.asset_id,
            employee_name: userMap[req.emp_id] || req.emp_id
        }));

        // Enrich Top Assets for Chart
        const enrichedTopAssets = topAssetsRaw.map(item => ({
            asset_name: hardwareMap[item._id] || item._id,
            count: item.count
        }));

        res.json({
            total: totalRequests,
            pending: pendingRequests,
            rejected: rejectedRequests,
            allocated: allocatedRequests,
            recent_activity: enrichedRequests,
            chart_top_assets: enrichedTopAssets,
            chart_status_dist: statusDistribution
        });

    } catch (err) {
        console.error("❌ Dashboard API Error:", err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;