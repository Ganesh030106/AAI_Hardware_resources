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

        // 🔒 SINGLE BACKEND RESTRICTION (ONLY THIS)
        if (
            !issue.technician_status ||
            issue.technician_status.toLowerCase() !== "unassigned"
        ) {
            return res.status(403).json({
                message: "AI analysis is allowed only when technician is unassigned."
            });
        }

        // -------------------------------
        // GLOBAL RULE-BASED AI ANALYSIS
        // -------------------------------
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

        // 🔥 Critical keywords
        if (/critical|urgent|bsod|overheating|crash|failure|down|not working/.test(combinedText)) {
            aiPriority = "High";
            aiRecommendation = "Immediate technician assignment recommended.";
            aiReason = "Critical keywords detected indicating high impact.";
        }

        // ⚠️ Warning keywords
        else if (/slow|error|lag|disconnect|warning|intermittent/.test(combinedText)) {
            aiPriority = "Medium";
            aiRecommendation = "Assign technician for inspection.";
            aiReason = "Potential productivity impact detected.";
        }

        // 🌐 Category escalation
        if (category.includes("network") || category.includes("server")) {
            if (aiPriority === "Low") aiPriority = "Medium";
            aiRecommendation = "Check network/server configuration and logs.";
            aiReason += " Issue relates to critical infrastructure.";
        }

        // Save AI analysis
        issue.aianalysis = {
            priority: aiPriority,
            recommendation: aiRecommendation,
            reason: aiReason
        };

        await issue.save();

        res.json({
            message: "AI analysis completed successfully.",
            aianalysis: issue.aianalysis
        });

    } catch (err) {
        console.error("AI Analysis Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;


