const mongoose = require("mongoose");

const holdingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 0 },
    avg: { type: Number, required: true },
    price: { type: Number, required: true },
    net: { type: String, default: "0.00%" },
    day: { type: String, default: "0.00%" },
    isLoss: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Holding", holdingSchema);
