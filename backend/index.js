const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// ── ALLOWED ORIGINS ───────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

// ── SOCKET.IO SETUP ───────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ── BASE STOCK PRICES ─────────────────────────────────────
const stockPrices = {
  RELIANCE: 2450.75, TCS: 3820.50, INFY: 1540.30,
  HDFCBANK: 1623.40, ICICIBANK: 985.20, HINDUNILVR: 2480.60,
  SBIN: 625.80, BAJFINANCE: 7120.90, BHARTIARTL: 875.45,
  KOTAKBANK: 1756.30, WIPRO: 445.20, HCLTECH: 1230.80,
  ASIANPAINT: 3150.40, MARUTI: 10250.60, TITAN: 3420.75,
  SUNPHARMA: 1180.50, ULTRACEMCO: 8920.30, NESTLEIND: 22450.80,
  POWERGRID: 245.60, NTPC: 310.40, ONGC: 185.20,
  TATASTEEL: 130.45, JSWSTEEL: 780.30, ADANIENT: 2580.70,
  ADANIPORTS: 1230.40, COALINDIA: 445.80, BPCL: 580.30,
  DIVISLAB: 3580.40, DRREDDY: 5480.90, CIPLA: 1280.60,
  EICHERMOT: 4250.80, HEROMOTOCO: 3890.40, BAJAJ_AUTO: 7650.30,
  TECHM: 1350.60, LTIM: 5420.80, MPHASIS: 2680.40,
  AXISBANK: 1045.30, INDUSINDBK: 1380.20, FEDERALBNK: 168.40,
  BANKBARODA: 230.60, PNB: 98.40, CANBK: 105.80,
  TATAMOTORS: 890.30, M_M: 1650.40, APOLLOHOSP: 6780.50,
  GRASIM: 2180.60, SHREECEM: 25480.30, ACC: 2380.40,
  AMBUJACEM: 620.80, DABUR: 545.30, MARICO: 590.20,
  COLPAL: 2780.50, PIDILITIND: 2880.30, BERGEPAINT: 545.60,
  HAVELLS: 1580.40, VOLTAS: 1180.30, WHIRLPOOL: 1380.50,
  ITC: 480.30, HINDPETRO: 380.40, IOC: 168.30,
  VEDL: 380.50, HINDZINC: 290.40, NMDC: 230.60,
  SAIL: 98.40, NATIONALUM: 168.30, MOIL: 380.40,
  RECLTD: 480.60, PFC: 448.30, IRFC: 168.40,
  CESC: 145.60, TATAPOWER: 380.50, ADANIGREEN: 1580.30,
  ZOMATO: 180.40, NYKAA: 180.30, PAYTM: 680.50,
  DELHIVERY: 380.30, IRCTC: 780.40, MUTHOOTFIN: 1580.60,
  CHOLAFIN: 1180.30, BAJAJHLDNG: 8950.40, SBILIFE: 1380.50,
  HDFCLIFE: 680.30, ICICIGI: 1780.40, SBICARD: 780.50,
};

// Lock in day-open price once at startup
const openPrices = { ...stockPrices };

// ── LIVE PRICE ENGINE (runs every 1 second) ───────────────
setInterval(() => {
  const updates = {};
  for (const symbol of Object.keys(stockPrices)) {
    const price = stockPrices[symbol];
    const rand = Math.random();
    // 2% chance of bigger spike, otherwise tiny tick
    const movePct = rand < 0.02
      ? (Math.random() - 0.5) * 0.01
      : (Math.random() - 0.5) * 0.005;

    let newPrice = parseFloat((price * (1 + movePct)).toFixed(2));
    // Circuit breaker: clamp within ±20% of open
    newPrice = Math.max(openPrices[symbol] * 0.80, Math.min(openPrices[symbol] * 1.20, newPrice));

    const change = parseFloat((newPrice - openPrices[symbol]).toFixed(2));
    const changePct = parseFloat(((change / openPrices[symbol]) * 100).toFixed(2));

    updates[symbol] = {
      price: newPrice,
      change,
      changePercent: `${change >= 0 ? "+" : ""}${changePct}%`,
      isDown: change < 0,
    };
    stockPrices[symbol] = newPrice;
  }
  io.emit("price_update", updates);
}, 1000);

// Send full snapshot on new connection
io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  const snapshot = {};
  for (const symbol of Object.keys(stockPrices)) {
    const change = parseFloat((stockPrices[symbol] - openPrices[symbol]).toFixed(2));
    const changePct = parseFloat(((change / openPrices[symbol]) * 100).toFixed(2));
    snapshot[symbol] = {
      price: stockPrices[symbol],
      change,
      changePercent: `${change >= 0 ? "+" : ""}${changePct}%`,
      isDown: change < 0,
    };
  }
  socket.emit("price_snapshot", snapshot);
  socket.on("disconnect", () => console.log(`🔌 Client disconnected: ${socket.id}`));
});

// ── MIDDLEWARE ────────────────────────────────────────────
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

// ── ROUTES ────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/ai", require("./routes/ai")); 

app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date() }));

app.use((req, res) => res.status(404).json({ message: "Route not found." }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error." });
});

// ── DATABASE + START ──────────────────────────────────────
const PORT = process.env.PORT || 3002;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    server.listen(PORT, () => console.log(`✅ Server running on port ${PORT} with live prices 📈`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });