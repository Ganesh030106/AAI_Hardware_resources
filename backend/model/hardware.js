//hardware.js
const mongoose = require("mongoose");

const HardwareSchema = new mongoose.Schema(
  {
    asset_id: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    model: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: false,
    collection: "hardware",
    versionKey: false
  }
);

module.exports = mongoose.model("hardware", HardwareSchema);
