// ==========================================
//         AI ANALYSIS ROUTES (RULE-BASED)
// ==========================================
const express = require("express");
const router = express.Router();
const IssueRequest = require("../model/IssueRequest");
const User = require("../model/users");

// ==========================================
//      AI ANALYSIS ENDPOINT (GENERAL RULES)
// ==========================================

// POST /api/aianalysis/:id
router.post("/:id", async (req, res) => {
    try {
        const issue = await IssueRequest.findById(req.params.id);
        if (!issue) {
            return res.status(404).json({ message: "Issue not found" });
        }

        // 🔒 ONLY restriction (FINAL)
        if (
            !issue.technician_status ||
            issue.technician_status.toLowerCase() !== "unassigned"
        ) {
            return res.status(403).json({
                message: "AI analysis allowed only when technician is unassigned"
            });
        }

        // ✅ NO priority restriction
        // ✅ NO department restriction

        let aiPriority = "Low";
        let aiRecommendation = "Monitor";
        let aiReason = "No critical indicators detected.";

        const category = (issue.category || "").toLowerCase();
        const combinedText = (
            (issue.issue || "") +
            " " +
            (issue.issue_description || "") +
            " " +
            (issue.priority || "")
        ).toLowerCase();

        // 🔥 Keyword escalation
        if (/critical|urgent|crash|down|failure|not working/.test(combinedText)) {
            aiPriority = "High";
            aiRecommendation = "Immediate technician assignment recommended.";
            aiReason = "Critical keywords detected.";
        }
        else if (/slow|error|lag|disconnect/.test(combinedText)) {
            aiPriority = "Medium";
            aiRecommendation = "Technician inspection advised.";
            aiReason = "Performance-related issue detected.";
        }

        // 🌐 Category-based boost
        if (category.includes("network") || category.includes("server")) {
            if (aiPriority === "Low") aiPriority = "Medium";
            aiReason += " Related to critical infrastructure.";
        }

        issue.aianalysis = {
            priority: aiPriority,
            recommendation: aiRecommendation,
            reason: aiReason
        };

        await issue.save();

        res.json({
            message: "AI analysis completed",
            aianalysis: issue.aianalysis
        });

    } catch (err) {
        console.error("AI Analysis Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});


module.exports = router;


