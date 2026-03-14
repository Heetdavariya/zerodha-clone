// frontend/src/dashboard/TradeInsightCard.jsx
// ── Post-Trade AI Insight Card ────────────────────────────
// Appears automatically after every successful buy/sell order
// Shows AI-generated headline, insight, stop-loss & price targets

import { useState, useEffect } from "react";
import api from "../utils/api";

// Sentiment badge colours
const SENTIMENT = {
  bullish: { bg: "#ecfdf5", color: "#065f46", dot: "#10b981", label: "Bullish" },
  bearish: { bg: "#fff1f2", color: "#9f1239", dot: "#f43f5e", label: "Bearish" },
  neutral: { bg: "#f8fafc", color: "#475569", dot: "#94a3b8", label: "Neutral" },
};

export default function TradeInsightCard({ trade, onClose }) {
  // trade = { stockName, mode, qty, price, product }
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slight delay so buy/sell window closes first, then we slide in
    const t = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    api
      .post("/ai/trade-insight", trade)
      .then(({ data }) => setInsight(data))
      .catch(() =>
        setInsight({
          headline: `${trade.mode === "BUY" ? "Buy order placed" : "Sell order executed"} — ${trade.stockName}`,
          insight: `You ${trade.mode === "BUY" ? "bought" : "sold"} ${trade.qty} shares of ${trade.stockName} at ₹${trade.price}.`,
          stopLoss: `Consider a stop-loss at ₹${(trade.price * 0.97).toFixed(2)} (3% below entry).`,
          sentiment: "neutral",
          price: trade.price,
          target5: (trade.price * 1.05).toFixed(2),
          target10: (trade.price * 1.10).toFixed(2),
          mode: trade.mode,
          stock: trade.stockName,
          qty: trade.qty,
          total: (trade.qty * trade.price).toFixed(2),
        })
      )
      .finally(() => setLoading(false));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const isBuy = trade.mode === "BUY";
  const sentimentKey = insight?.sentiment?.toLowerCase() || "neutral";
  const sent = SENTIMENT[sentimentKey] || SENTIMENT.neutral;
  const accentColor = isBuy ? "#10b981" : "#f43f5e";
  const accentBg    = isBuy ? "#ecfdf5" : "#fff1f2";

  return (
    <>
      <style>{`
        @keyframes insightSlideIn {
          from { opacity: 0; transform: translateX(110%); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes insightSlideOut {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(110%); }
        }
        @keyframes insightShimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes insightFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .insight-close:hover { background: #f1f5f9 !important; }
        .insight-chat-btn:hover { opacity: 0.88; }
        /* ── Responsive trade insight card ── */
        @media (max-width: 480px) {
          .trade-insight-card {
            bottom: 0 !important;
            right: 0 !important;
            left: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            border-radius: 18px 18px 0 0 !important;
          }
        }
        @media (min-width: 481px) and (max-width: 768px) {
          .trade-insight-card {
            width: calc(100vw - 32px) !important;
            max-width: 380px !important;
            right: 16px !important;
            bottom: 90px !important;
          }
        }
      `}</style>

      {/* Card */}
      <div
        className="trade-insight-card"
        style={{
          position: "fixed",
          bottom: 100,
          right: 28,
          width: 360,
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 20px 60px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.08)",
          zIndex: 10000,
          overflow: "hidden",
          border: "1px solid #e2e8f0",
          animation: visible
            ? "insightSlideIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards"
            : "insightSlideOut 0.3s ease forwards",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            height: 4,
            background: isBuy
              ? "linear-gradient(90deg, #10b981, #059669)"
              : "linear-gradient(90deg, #f43f5e, #e11d48)",
          }}
        />

        {/* Header */}
        <div
          style={{
            padding: "14px 16px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Trade icon */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: accentBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
              }}
            >
              {isBuy ? "📈" : "📉"}
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Kite AI · Trade Insight
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e", marginTop: 1 }}>
                {trade.stockName}
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 99,
                    background: accentBg,
                    color: accentColor,
                  }}
                >
                  {isBuy ? "BUY" : "SELL"} {trade.qty}
                </span>
              </div>
            </div>
          </div>
          <button
            className="insight-close"
            onClick={handleClose}
            style={{
              width: 28, height: 28,
              borderRadius: 8,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 14,
              color: "#94a3b8",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "0.15s ease",
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "14px 16px 16px" }}>
          {loading ? (
            // Skeleton shimmer
            <div>
              {[80, 100, 60, 90].map((w, i) => (
                <div
                  key={i}
                  style={{
                    height: i === 0 ? 18 : 13,
                    width: `${w}%`,
                    borderRadius: 6,
                    marginBottom: i === 0 ? 14 : 8,
                    background: "linear-gradient(90deg, #f0f4f8 25%, #e2e8f0 50%, #f0f4f8 75%)",
                    backgroundSize: "800px 100%",
                    animation: "insightShimmer 1.5s infinite linear",
                  }}
                />
              ))}
              <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 10 }}>
                ✦ Analysing your trade...
              </div>
            </div>
          ) : (
            <div style={{ animation: "insightFadeIn 0.4s ease" }}>

              {/* Headline */}
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#1a1a2e",
                  lineHeight: 1.4,
                  marginBottom: 10,
                }}
              >
                {insight.headline}
              </div>

              {/* Sentiment + price row */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "4px 10px",
                    borderRadius: 99,
                    background: sent.bg,
                    fontSize: 12,
                    fontWeight: 600,
                    color: sent.color,
                  }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: sent.dot }} />
                  {sent.label}
                </div>
                <div
                  style={{
                    padding: "4px 10px",
                    borderRadius: 99,
                    background: "#f8fafc",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  ₹{parseFloat(insight.price).toFixed(2)} entry
                </div>
                <div
                  style={{
                    padding: "4px 10px",
                    borderRadius: 99,
                    background: "#f8fafc",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  ₹{parseFloat(insight.total).toLocaleString("en-IN")} total
                </div>
              </div>

              {/* AI Insight */}
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: 10,
                  padding: "10px 12px",
                  fontSize: 13,
                  color: "#374151",
                  lineHeight: 1.6,
                  marginBottom: 10,
                  borderLeft: `3px solid ${accentColor}`,
                }}
              >
                {insight.insight}
              </div>

              {/* Price levels grid — labels and direction differ for BUY vs SELL */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 6,
                  marginBottom: 10,
                }}
              >
                {[
                  {
                    label: "Stop Loss",
                    value: isBuy
                      ? (parseFloat(insight.price) * 0.97).toFixed(2)
                      : (parseFloat(insight.price) * 1.03).toFixed(2),
                    sublabel: isBuy ? "▼ 3% below" : "▲ 3% above",
                    color: "#f43f5e", bg: "#fff1f2",
                  },
                  {
                    label: isBuy ? "Target 5%" : "Buyback 5%",
                    value: insight.target5,
                    sublabel: isBuy ? "▲ 5% above" : "▼ 5% below",
                    color: "#10b981", bg: "#ecfdf5",
                  },
                  {
                    label: isBuy ? "Target 10%" : "Buyback 10%",
                    value: insight.target10,
                    sublabel: isBuy ? "▲ 10% above" : "▼ 10% below",
                    color: "#059669", bg: "#d1fae5",
                  },
                ].map((level) => (
                  <div
                    key={level.label}
                    style={{
                      background: level.bg,
                      borderRadius: 8,
                      padding: "8px 6px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 500, marginBottom: 3 }}>
                      {level.label}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: level.color }}>
                      ₹{parseFloat(level.value).toFixed(2)}
                    </div>
                    <div style={{ fontSize: 9, color: level.color, marginTop: 2, opacity: 0.8 }}>
                      {level.sublabel}
                    </div>
                  </div>
                ))}
              </div>

              {/* Stop-loss tip */}
              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  padding: "8px 10px",
                  background: "#fffbeb",
                  borderRadius: 8,
                  border: "1px solid #fde68a",
                  marginBottom: 12,
                  display: "flex",
                  gap: 6,
                  alignItems: "flex-start",
                }}
              >
                <span style={{ fontSize: 14 }}>💡</span>
                <span>{insight.stopLoss}</span>
              </div>

              {/* Footer disclaimer */}
              <div style={{ fontSize: 10.5, color: "#94a3b8", textAlign: "center" }}>
                ✦ AI-generated · Educational purposes only · Not financial advice
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}