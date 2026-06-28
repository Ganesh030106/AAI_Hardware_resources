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

        if (
            !issue.priority ||
            issue.priority.toLowerCase() !== "pending"
        ) {
            return res.status(403).json({
                message: "AI analysis allowed only when priority is pending"
            });
        }


        const category = (issue.category || "").toLowerCase();
        const maintenance = (issue.issue || "").toLowerCase();
        const description = (issue.description || "").toLowerCase();

        const combinedText = `${category} ${maintenance} ${description}`;

        let aiPriority = "Low";
        let aiRecommendation = "Monitor status and schedule visual check if issue persists.";
        let aiReason = "No high-severity critical or medium-severity warning indicators identified.";

        const highPriorityRegex = /critical|urgent|crash|down|failure|not working|broken|damage|dead|corrupted|smoke|fire|spark|burnt|melt|leak|explosion|overheating|overheat|high heat|high temp|no power|dead battery/;
        const mediumPriorityRegex = /slow|error|lag|disconnect|hang|freeze|warn|malfunction|reboot|stuck|heat|heating|temp|temperature|noise|flicker|flickering|beep|battery|hot|warm|drain|charge|charging|fan/;

        // 🔥 Keyword escalation
        if (highPriorityRegex.test(combinedText)) {
            const matchedWord = combinedText.match(highPriorityRegex)[0];
            aiPriority = "High";
            aiRecommendation = "Immediate technician assignment and physical inspection recommended.";
            aiReason = `Critical indicator ("${matchedWord}") detected in the reported Category, Maintenance, or Description.`;
        }
        else if (mediumPriorityRegex.test(combinedText)) {
            const matchedWord = combinedText.match(mediumPriorityRegex)[0];
            aiPriority = "Medium";
            aiRecommendation = "Standard technician troubleshooting and diagnostics advised.";
            aiReason = `Stability/performance indicator ("${matchedWord}") identified in the reported Category, Maintenance, or Description.`;
        }

        // 🌐 Category-based boost
        if (category.includes("network") || category.includes("server")) {
            if (aiPriority === "Low") {
                aiPriority = "Medium";
                aiRecommendation = "Standard technician troubleshooting and diagnostics advised.";
                aiReason = "Issue is related to critical infrastructure (network/server).";
            } else {
                aiReason += " Issue is related to critical infrastructure.";
            }
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


