const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { verifyAdmin } = require("../middleware/auth");
const User = require("../models/User");
const Order = require("../models/Order");
const Holding = require("../models/Holding");
const Position = require("../models/Position");

// GET /api/admin/stats — dashboard overview stats
router.get("/stats", verifyAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const activeUsers = await User.countDocuments({ role: "user", isActive: true });
    const totalOrders = await Order.countDocuments();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayOrders = await Order.countDocuments({ createdAt: { $gte: todayStart } });
    const newUsersToday = await User.countDocuments({ createdAt: { $gte: todayStart } });
    const pendingKyc = await User.countDocuments({ kycStatus: "pending", role: "user" });

    // Orders by mode
    const buyOrders = await Order.countDocuments({ mode: "BUY" });
    const sellOrders = await Order.countDocuments({ mode: "SELL" });

    // Recent registrations (last 7 days by day)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const usersByDay = await User.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, role: "user" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      totalOrders,
      todayOrders,
      newUsersToday,
      pendingKyc,
      buyOrders,
      sellOrders,
      usersByDay,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

// GET /api/admin/users — list all users with pagination + search
router.get("/users", verifyAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status, kyc } = req.query;
    const query = { role: "user" };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;
    if (kyc) query.kycStatus = kyc;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// GET /api/admin/users/:id — single user detail
router.get("/users/:id", verifyAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    const orders = await Order.find({ user: req.params.id }).sort({ createdAt: -1 });
    const holdings = await Holding.find({ user: req.params.id });
    res.json({ user, orders, holdings });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// PUT /api/admin/users/:id — update user (status, kyc, funds)
router.put("/users/:id", verifyAdmin, async (req, res) => {
  try {
    const { isActive, kycStatus, funds, name, phone } = req.body;
    const update = {};
    if (isActive !== undefined) update.isActive = isActive;
    if (kycStatus) update.kycStatus = kycStatus;
    if (funds !== undefined) update.funds = funds;
    if (name) update.name = name;
    if (phone !== undefined) update.phone = phone;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ message: "User updated.", user });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// DELETE /api/admin/users/:id — delete user and all their data
router.delete("/users/:id", verifyAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Order.deleteMany({ user: req.params.id });
    await Holding.deleteMany({ user: req.params.id });
    await Position.deleteMany({ user: req.params.id });
    res.json({ message: "User and all their data deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// GET /api/admin/orders — all orders with filters
router.get("/orders", verifyAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, mode, status, search } = req.query;
    const query = {};
    if (mode) query.mode = mode;
    if (status) query.status = status;
    if (search) query.name = { $regex: search, $options: "i" };

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ orders, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// POST /api/admin/create-admin — create admin account (requires setup key)
router.post("/create-admin", async (req, res) => {
  try {
    const { name, email, password, setupKey } = req.body;
    if (setupKey !== process.env.ADMIN_SETUP_KEY)
      return res.status(403).json({ message: "Invalid setup key." });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already in use." });

    const hashed = await bcrypt.hash(password, 12);
    const admin = await User.create({ name, email, password: hashed, role: "admin", kycStatus: "verified" });
    res.status(201).json({ message: "Admin account created.", id: admin._id });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
