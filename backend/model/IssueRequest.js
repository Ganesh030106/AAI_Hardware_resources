//issueRequest.js
const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
    emp_id: String,
    asset_id: String,
    category: String,
    issue: String,
    priority: {
        type: String,
        enum: ["Pending","Low","Medium","High"],
        default: "Pending"
    },
    description: String,
    created_at: {
        type: Date,
        default: Date.now
    },
    technician_status: {
        type: String,
        enum: ["Unassigned","assigned"],
        default: "Unassigned"
    },
    // AI Analysis field for rule-based protocol
    aianalysis: {
        priority: { type: String, enum: ["Low", "Medium", "High"], default: "Low" },
        recommendation: { type: String, default: "" },
        reason: { type: String, default: "" }
    }
},{
    versionKey: false,
    collection: "issuerequests"
});

module.exports = mongoose.model("issuerequests", requestSchema);

// try {
//                 const res = await fetch(apiUrl, { method: 'POST' });
//                 if(!res.ok) throw new Error('AI analysis failed');
//         const data = await res.json();
//         // Show AI details for this row only
//         const detailsDiv = document.getElementById(`ai-details-${issueId}`);
//         if (detailsDiv && data.aianalysis) {
//             detailsDiv.style.display = '';
//             detailsDiv.innerHTML = `
//                         <div class=\"text-xs text-left\">
//                             <div class=\"mb-1\"><span class=\"font-bold\">AI Priority:</span> <span class=\"inline-block px-2 py-0.5 rounded-full ${data.aianalysis.priority === 'High' ? 'bg-red-100 text-red-700' :
//                     data.aianalysis.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
//                         'bg-green-100 text-green-700'}\">${data.aianalysis.priority}</span></div>
//                             <div class=\"mb-1\"><span class=\"font-bold\">AI Recommendation:</span> ${data.aianalysis.recommendation}</div>
//                             <div><span class=\"font-bold\">AI Reason:</span> ${data.aianalysis.reason}</div>
//                         </div>
//                     `;
//         }
//     } catch (err) {
//         alert('AI analysis failed.');
//         console.error(err);
//     } finally {
//         btn.disabled = false;
//         btn.innerText = 'Analyze with AI';
//     }
