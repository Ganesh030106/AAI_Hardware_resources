//allocation.js
const mongoose = require("mongoose");

const AllocationSchema = new mongoose.Schema({
  asset_id: {
    type: String,
    required: true
  },
  emp_id: {
    type: String,
    required: true
  },
  request_id: {
    type: Number,
    required: true
  },
  allocated_date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ["allocated", "rejected"],
    default: "allocated"
  }
},
  {
    versionKey: false,
    collection: "allocations"
  });

module.exports = mongoose.model(
  "allocations",
  AllocationSchema,
);

