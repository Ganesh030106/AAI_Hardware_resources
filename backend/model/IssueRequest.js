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


