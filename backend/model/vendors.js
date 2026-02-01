//vendors.js
const mongoose = require("mongoose");

const vendorsSchema = new mongoose.Schema(
  {
    gst_number: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    phone: {
      type: Number,
      required: true
    },
    seller_id: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    seller_name: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: false,
    collection: "vendors",
    versionKey: false
  }
);

module.exports = mongoose.model("vendors", vendorsSchema);
