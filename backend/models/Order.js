const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    qty: { type: Number, required: true },
    price: { type: Number, required: true },
    mode: {
      type: String,
      enum: ["BUY", "SELL"],
      required: true,
    },
    status: {
      type: String,
      enum: ["OPEN", "EXECUTED", "CANCELLED", "REJECTED"],
      default: "EXECUTED",
    },
    orderType: {
      type: String,
      enum: ["MARKET", "LIMIT", "SL", "SL-M"],
      default: "MARKET",
    },
    product: {
      type: String,
      enum: ["CNC", "MIS", "NRML"],
      default: "CNC",
    },
    exchange: {
      type: String,
      enum: ["NSE", "BSE"],
      default: "NSE",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
