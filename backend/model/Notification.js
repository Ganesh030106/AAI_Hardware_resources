const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
    recipient_id: {
        type: String, // Technician's emp_id
        required: true
    },
    message: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    versionKey: false,
    collection: "notifications"
});

module.exports = mongoose.model("Notification", NotificationSchema);
