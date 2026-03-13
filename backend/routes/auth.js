const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Holding = require("../models/Holding");
const Position = require("../models/Position");
const Watchlist = require("../models/Watchlist");
const { verifyToken } = require("../middleware/auth");

// Helper: generate JWT
const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, email and password are required." });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ message: "An account with this email already exists." });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed, phone: phone || "" });

    const token = generateToken(user);
    res.status(201).json({
      message: "Account created successfully!",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required." });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Invalid email or password." });

    if (!user.isActive)
      return res.status(403).json({ message: "Your account has been deactivated. Contact support." });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: "Invalid email or password." });

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);
    res.json({
      message: "Login successful!",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

// GET /api/auth/me — get current user profile
router.get("/me", verifyToken, async (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/profile — update profile
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true, runValidators: true }
    ).select("-password");
    res.json({ message: "Profile updated.", user });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// PUT /api/auth/change-password
router.put("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "Both current and new password required." });

    const user = await User.findById(req.user._id);
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match)
      return res.status(401).json({ message: "Current password is incorrect." });

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ message: "Password updated successfully." });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
