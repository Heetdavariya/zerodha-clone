// backend/routes/ai.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const Holding = require("../models/Holding");
const Position = require("../models/Position");
const Order = require("../models/Order");
const Watchlist = require("../models/Watchlist");
const User = require("../models/User");

// ── POST /api/ai/chat ─────────────────────────────────────
router.post("/chat", verifyToken, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: "Message is required." });
    if (!process.env.GEMINI_API_KEY) return res.status(503).json({ message: "AI service not configured. Please add GEMINI_API_KEY to backend .env" });

    const [user, holdings, positions, recentOrders, watchlist] = await Promise.all([
      User.findById(req.user._id).select("name funds"),
      Holding.find({ user: req.user._id }),
      Position.find({ user: req.user._id }),
      Order.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10),
      Watchlist.find({ user: req.user._id }),
    ]);

    const totalInvested = holdings.reduce((s, h) => s + h.avg * h.qty, 0);
    const totalCurrent  = holdings.reduce((s, h) => s + h.price * h.qty, 0);
    const totalPnl      = totalCurrent - totalInvested;

    const holdingsSummary   = holdings.length   ? holdings.map((h) => `  - ${h.name}: ${h.qty} shares, avg ₹${h.avg.toFixed(2)}, current ₹${h.price.toFixed(2)}, P&L ₹${((h.price - h.avg) * h.qty).toFixed(2)}`).join("\n") : "  None";
    const positionsSummary  = positions.length  ? positions.map((p) => `  - ${p.name}: ${p.qty} shares (${p.product}), avg ₹${p.avg.toFixed(2)}, current ₹${p.price.toFixed(2)}, P&L ₹${((p.price - p.avg) * p.qty).toFixed(2)}`).join("\n") : "  None";
    const ordersSummary     = recentOrders.length ? recentOrders.map((o) => `  - ${o.mode} ${o.qty} ${o.name} @ ₹${o.price} (${o.product || "CNC"}, ${o.status})`).join("\n") : "  None";
    const watchlistSummary  = watchlist.length  ? watchlist.map((w) => `  - ${w.name} @ ₹${w.price?.toFixed(2) || "N/A"}`).join("\n") : "  None";

    const systemPrompt = `You are Kite AI, a stock market assistant in Zerodha Kite. Be friendly and concise. Use INR and NSE/BSE context. Bold stock names/numbers. Use bullets for lists. Never give absolute buy/sell calls, say "consider". Redirect off-topic questions to finance.
USER:${user.name} Funds:${(user.funds||0).toFixed(2)} Invested:${totalInvested.toFixed(2)} Current:${totalCurrent.toFixed(2)} PnL:${totalPnl.toFixed(2)}
HOLDINGS:${holdingsSummary}
POSITIONS:${positionsSummary}
WATCHLIST:${watchlistSummary}
ORDERS:${ordersSummary}`;

    const geminiHistory = history.slice(-6).filter((m) => m.role && m.content).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [...geminiHistory, { role: "user", parts: [{ text: message }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 500, topP: 0.9 },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          ],
        }),
      }
    );

    if (!geminiRes.ok) { console.error("Gemini chat error:", await geminiRes.text()); return res.status(502).json({ message: "AI service temporarily unavailable." }); }
    const geminiData = await geminiRes.json();
    res.json({ reply: geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response." });
  } catch (err) {
    console.error("AI chat error:", err);
    res.status(500).json({ message: "Something went wrong." });
  }
});

module.exports = router;