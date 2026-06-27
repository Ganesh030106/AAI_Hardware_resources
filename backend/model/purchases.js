//purchases.js
const mongoose = require("mongoose");

const PurchaseSchema = new mongoose.Schema(
  {
    arrival_date: {
      type: Date,
      required: true
    },
    asset_name: {
      type: String,
      required: true,
      trim: true
    },
    model_name: {
      type: String,
      required: true,
      trim: true
    },
    purchase_id: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    seller_id: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: false,
    collection: "purchases",
    versionKey: false
  }
);

module.exports = mongoose.model("purchases", PurchaseSchema);
