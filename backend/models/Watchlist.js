const mongoose = require("mongoose");

const watchlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, default: 0 },
    change: { type: String, default: "0.00" },
    changePercent: { type: String, default: "0.00%" },
    isDown: { type: Boolean, default: false },
    exchange: { type: String, default: "NSE" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Watchlist", watchlistSchema);
