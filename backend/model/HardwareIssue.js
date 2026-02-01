//hardwareIssue.js
const mongoose = require("mongoose");

const HardwareIssueSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true
    },
    issue: {
      type: String,
      required: true,
      trim: true
    },
    priority: {
      type: String,
      required: true,
      trim: true,
      enum: ["Pending","Low","Medium","High"],
      default: "Pending"
    }
  },
  {
    timestamps: false,
    collection: "hardware_issues",
    versionKey: false
  }
);

module.exports = mongoose.model("hardware_issues", HardwareIssueSchema);
