const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
    emp_id: {
        type: String,
        required: true
    },
    date: {
        type: String, // Format: YYYY-MM-DD
        required: true
    },
    status: {
        type: String,
        enum: ["Present", "Absent"],
        default: "Absent"
    },
    check_in_at: {
        type: String,
        default: ""
    },
    check_out_at: {
        type: String,
        default: ""
    }
}, {
    versionKey: false,
    collection: "attendance"
});

// Avoid duplicate attendance logs for the same day/technician
AttendanceSchema.index({ emp_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", AttendanceSchema);
