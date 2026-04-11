const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const Holding = require("../models/Holding");
const Position = require("../models/Position");
const Order = require("../models/Order");
const Watchlist = require("../models/Watchlist");
const User = require("../models/User");

// ── HOLDINGS ──────────────────────────────────────────────
router.get("/holdings", verifyToken, async (req, res) => {
  try {
    const holdings = await Holding.find({ user: req.user._id });
    res.json(holdings);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ── POSITIONS ─────────────────────────────────────────────
router.get("/positions", verifyToken, async (req, res) => {
  try {
    const positions = await Position.find({ user: req.user._id });
    res.json(positions);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ── ORDERS ────────────────────────────────────────────────
router.get("/orders", verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// POST /api/dashboard/orders — place a new order
router.post("/orders", verifyToken, async (req, res) => {
  try {
    const { name, qty, price, mode, orderType, product, exchange } = req.body;
    if (!name || !qty || !price || !mode)
      return res.status(400).json({ message: "Stock name, qty, price and mode are required." });

    const user = await User.findById(req.user._id);
    const totalCost = qty * price;

    if (mode === "BUY") {
      // Check funds first
      if (user.funds < totalCost)
        return res.status(400).json({ message: "Insufficient funds." });

      // Deduct funds
      user.funds -= totalCost;
      await user.save();

      if (product === "MIS") {
        // ── Intraday trade → goes to Positions
        const existing = await Position.findOne({ user: req.user._id, name });
        if (existing) {
          const newQty = existing.qty + qty;
          const newAvg = ((existing.avg * existing.qty) + (price * qty)) / newQty;
          existing.qty = newQty;
          existing.avg = parseFloat(newAvg.toFixed(2));
          existing.price = price;
          await existing.save();
        } else {
          await Position.create({
            user: req.user._id,
            product: "MIS",
            name,
            qty,
            avg: price,
            price,
            net: "0",
            day: "0%",
            isLoss: false,
          });
        }
      } else {
        // ── CNC or NRML → goes to Holdings
        const existing = await Holding.findOne({ user: req.user._id, name });
        if (existing) {
          const newQty = existing.qty + qty;
          const newAvg = ((existing.avg * existing.qty) + (price * qty)) / newQty;
          existing.qty = newQty;
          existing.avg = parseFloat(newAvg.toFixed(2));
          existing.price = price;
          await existing.save();
        } else {
          await Holding.create({ user: req.user._id, name, qty, avg: price, price });
        }
      }

    } else if (mode === "SELL") {
      if (product === "MIS") {
        // ── Selling intraday → check Positions first
        const position = await Position.findOne({ user: req.user._id, name });
        if (position && position.qty >= qty) {
          position.qty -= qty;
          if (position.qty === 0) await position.deleteOne();
          else { position.price = price; await position.save(); }
        } else {
          // Fallback to holdings if not found in positions
          const holding = await Holding.findOne({ user: req.user._id, name });
          if (holding && holding.qty >= qty) {
            holding.qty -= qty;
            if (holding.qty === 0) await holding.deleteOne();
            else { holding.price = price; await holding.save(); }
          } else {
            return res.status(400).json({ message: "Insufficient holdings to sell." });
          }
        }
      } else {
        // ── Selling CNC/NRML → check Holdings first
        const holding = await Holding.findOne({ user: req.user._id, name });
        if (holding && holding.qty >= qty) {
          holding.qty -= qty;
          if (holding.qty === 0) await holding.deleteOne();
          else { holding.price = price; await holding.save(); }
        } else {
          // Fallback to positions if not found in holdings
          const position = await Position.findOne({ user: req.user._id, name });
          if (position && position.qty >= qty) {
            position.qty -= qty;
            if (position.qty === 0) await position.deleteOne();
            else { position.price = price; await position.save(); }
          } else {
            return res.status(400).json({ message: "Insufficient holdings to sell." });
          }
        }
      }

      // Credit funds back
      user.funds += totalCost;
      await user.save();
    }

    // Save order record
    const order = await Order.create({
      user: req.user._id,
      name,
      qty,
      price,
      mode,
      orderType: orderType || "MARKET",
      product: product || "CNC",
      exchange: exchange || "NSE",
      status: "EXECUTED",
    });

    const action = mode === "BUY" ? "Bought" : "Sold";
    const totalAmt = (qty * price).toLocaleString("en-IN", { minimumFractionDigits: 2 });
    res.status(201).json({
      message: `${action} ${qty} share${qty > 1 ? "s" : ""} of ${name} @ ₹${price} — ₹${totalAmt} ${mode === "BUY" ? "debited" : "credited"}.`,
      order
    });
  } catch (err) {
    console.error("Order error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// DELETE /api/dashboard/orders/:id — cancel order
router.delete("/orders/:id", verifyToken, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ message: "Order not found." });
    order.status = "CANCELLED";
    await order.save();
    res.json({ message: "Order cancelled." });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ── FUNDS ─────────────────────────────────────────────────
router.get("/funds", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("funds");
    res.json({ funds: user.funds });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

router.post("/funds/add", verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0)
      return res.status(400).json({ message: "Valid amount required." });
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { funds: amount } },
      { new: true }
    ).select("funds");
    res.json({ message: `₹${amount} added successfully.`, funds: user.funds });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ── WATCHLIST ─────────────────────────────────────────────
router.get("/watchlist", verifyToken, async (req, res) => {
  try {
    const list = await Watchlist.find({ user: req.user._id });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

router.post("/watchlist", verifyToken, async (req, res) => {
  try {
    const { name, price, change, changePercent, isDown, exchange } = req.body;
    if (!name) return res.status(400).json({ message: "Stock name required." });
    const exists = await Watchlist.findOne({ user: req.user._id, name });
    if (exists) return res.status(409).json({ message: "Already in watchlist." });
    const item = await Watchlist.create({
      user: req.user._id,
      name,
      price: price || 0,
      change: change || "0",
      changePercent: changePercent || "0%",
      isDown: isDown || false,
      exchange: exchange || "NSE",
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

router.delete("/watchlist/:id", verifyToken, async (req, res) => {
  try {
    await Watchlist.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: "Removed from watchlist." });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ── SUMMARY / PORTFOLIO ───────────────────────────────────
router.get("/summary", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("funds name email");
    const holdings = await Holding.find({ user: req.user._id });
    const positions = await Position.find({ user: req.user._id });
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(5);

    const investedValue = holdings.reduce((acc, h) => acc + h.avg * h.qty, 0);
    const currentValue = holdings.reduce((acc, h) => acc + h.price * h.qty, 0);
    const totalPnl = currentValue - investedValue;
    const totalPnlPercent = investedValue > 0
      ? ((totalPnl / investedValue) * 100).toFixed(2)
      : "0.00";

    res.json({
      user,
      funds: user.funds,
      investedValue: parseFloat(investedValue.toFixed(2)),
      currentValue: parseFloat(currentValue.toFixed(2)),
      totalPnl: parseFloat(totalPnl.toFixed(2)),
      totalPnlPercent,
      holdingsCount: holdings.length,
      positionsCount: positions.length,
      recentOrders: orders,
      holdings: holdings.map((h) => ({ name: h.name, qty: h.qty, avg: h.avg, price: h.price })),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
