//hardwareRequest.js
const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  request_id: Number,
  asset_id: String,
  emp_id: String,
  quantity: Number,
  status: {
    type: String,
    enum: ["allocated", "rejected"],
    default: "allocated"
  },
  order_date: {
    type: Date,
    default: Date.now
  },
}, {
  versionKey: false,
  collection: "hardware_requests"
});

module.exports = mongoose.model("hardware_requests", requestSchema,);
