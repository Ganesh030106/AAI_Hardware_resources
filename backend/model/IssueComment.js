const mongoose = require("mongoose");

const IssueCommentSchema = new mongoose.Schema({
    issue_id: {
        type: String,
        required: true
    },
    author_id: {
        type: String,
        required: true
    },
    author_name: {
        type: String,
        required: true
    },
    author_role: {
        type: String,
        required: true,
        enum: ["Employee", "Admin", "Superadmin", "Technician"]
    },
    comment: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    versionKey: false,
    collection: "issuecomments"
});

module.exports = mongoose.model("IssueComment", IssueCommentSchema);
