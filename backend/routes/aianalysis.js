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

router.post("/:id", async (req, res) => {
    try {
        const issue = await IssueRequest.findById(req.params.id);
        if (!issue) return res.status(404).json({ message: "Issue not found" });

        // Only analyze if priority is Pending
        if (issue.priority.toLowerCase() !== "pending") {
            return res.status(400).json({ message: "AI analysis only available for Pending issues." });
        }

        // Default AI analysis
        let aiPriority = "Low";
        let aiRecommendation = "Monitor";
        let aiReason = "No critical impact detected.";

        // Fetch user for department
        const user = await User.findOne({ emp_id: issue.emp_id });
        const issueText = ((issue.issue || "") + " " + (issue.issue_description || "")).toLowerCase();
        const category = (issue.category || "").toLowerCase();

        // Rule 1: Critical keywords or category
        if (issueText.match(/critical|urgent|bsod|overheating|failure/) || category.includes("network") || category.includes("server")) {
            aiPriority = "High";
            aiRecommendation = "Assign technician / Review";
            aiReason = "Issue likely to impact productivity or critical systems.";
        }
        // Rule 2: Medium severity keywords
        else if (issueText.match(/error|slow|warning/)) {
            aiPriority = "Medium";
            aiRecommendation = "Assign technician";
            aiReason = "Issue may affect user workflow; technician assignment recommended.";
        }
        // Rule 3: Default Low
        else {
            aiPriority = "Low";
            aiRecommendation = "Monitor";
            aiReason = "No immediate action required.";
        }

        // Save AI analysis
        issue.aianalysis = {
            priority: aiPriority,
            recommendation: aiRecommendation,
            reason: aiReason
        };

        // ✅ FIX ENUM CASE ISSUE
        if (issue.technician_status) {
            issue.technician_status =
                issue.technician_status.charAt(0).toUpperCase() +
                issue.technician_status.slice(1).toLowerCase();
        }

        await issue.save();

        res.json({
            aianalysis: issue.aianalysis,
            message: "AI analysis completed and saved."
        });

    } catch (err) {
        console.error("AI Analysis error:", err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;

