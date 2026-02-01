// ==========================================
//         AI ANALYSIS ROUTES (RULE-BASED)
// ==========================================
const express = require("express");
const router = express.Router();
const IssueRequest = require("../model/IssueRequest");
const User = require("../model/users");

// POST /api/aianalysis/:id
router.post("/:id", async (req, res) => {
    try {
        const issue = await IssueRequest.findById(req.params.id);
        if (!issue) return res.status(404).json({ message: "Issue not found" });

        // Rule-based protocol for AI analysis
        let aiPriority = "Low";
        let aiRecommendation = "Review";
        let aiReason = "";

        // Example rules (customize as needed):
        // High priority if: HR or OPERATIONS dept and High/Medium severity issue
        // Medium if: category is Desktop/Laptop and issue is critical
        // Otherwise Low

        // Fetch user for dept
        const user = await User.findOne({ emp_id: issue.emp_id });
        const dept = user ? (user.dept || "").toUpperCase() : "";
        const issueText = (issue.issue || "").toLowerCase();
        const category = (issue.category || "").toLowerCase();

        if ((dept === "HR" || dept === "OPERATIONS") && (issue.priority === "High" || issue.priority === "Medium")) {
            aiPriority = "High";
            aiRecommendation = "Review";
            aiReason = "Issue impacts critical department and requires admin attention.";
        } else if (category.includes("desktop") || category.includes("laptop")) {
            if (issueText.includes("bsod") || issueText.includes("overheating") || issueText.includes("critical")) {
                aiPriority = "Medium";
                aiRecommendation = "Assign technician";
                aiReason = "Device issue may impact productivity; technician assignment recommended.";
            }
        } else if (issue.priority === "High") {
            aiPriority = "High";
            aiRecommendation = "Review";
            aiReason = "Marked as high priority by user.";
        } else {
            aiPriority = "Low";
            aiRecommendation = "Monitor";
            aiReason = "No critical impact detected.";
        }

        // Update the issue with AI analysis
        issue.aianalysis = {
            priority: aiPriority,
            recommendation: aiRecommendation,
            reason: aiReason
        };
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
