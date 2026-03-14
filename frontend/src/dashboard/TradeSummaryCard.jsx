// frontend/src/dashboard/TradeSummaryCard.jsx
// ── Post-CNC-Sell Summary Card ────────────────────────────
// Appears after selling a delivery (CNC) holding
// Shows: Realized P&L · Tax estimate · AI timing opinion · Re-entry suggestion

import { useState, useEffect } from "react";
import api from "../utils/api";

const SENTIMENT = {
  bullish: { bg: "#ecfdf5", color: "#065f46", dot: "#10b981", label: "Bullish" },
  bearish: { bg: "#fff1f2", color: "#9f1239", dot: "#f43f5e", label: "Bearish" },
  neutral: { bg: "#f8fafc", color: "#475569", dot: "#94a3b8", label: "Neutral" },
};

export default function TradeSummaryCard({ trade, onClose }) {
  // trade = { stockName, qty, price (sell), avgBuyPrice, product }
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const pnlPerShare = trade.price - trade.avgBuyPrice;
    const totalPnl    = pnlPerShare * trade.qty;
    const isProfit    = pnlPerShare >= 0;

    api.post("/ai/trade-summary", {
      stockName:   trade.stockName,
      qty:         trade.qty,
      sellPrice:   trade.price,
      avgBuyPrice: trade.avgBuyPrice,
      product:     trade.product,
    })
      .then(({ data }) => setData(data))
      .catch(() => setData({
        stockName:   trade.stockName,
        qty:         trade.qty,
        sellPrice:   trade.price,
        avgBuyPrice: trade.avgBuyPrice,
        pnlPerShare: parseFloat(pnlPerShare.toFixed(2)),
        totalPnl:    parseFloat(totalPnl.toFixed(2)),
        pnlPct:      parseFloat(((pnlPerShare / trade.avgBuyPrice) * 100).toFixed(2)),
        isProfit,
        stcg:        isProfit ? parseFloat((totalPnl * 0.15).toFixed(2)) : 0,
        ltcg:        isProfit ? parseFloat((Math.max(0, totalPnl - 100000) * 0.10).toFixed(2)) : 0,
        opinion:     `You sold ${trade.qty} shares of ${trade.stockName} at ₹${trade.price}.`,
        reentry:     `Consider re-entering on dips near ₹${(trade.price * 0.95).toFixed(2)}.`,
        sentiment:   isProfit ? "bullish" : "bearish",
      }))
      .finally(() => setLoading(false));
  }, []);

  const handleClose = () => { setVisible(false); setTimeout(onClose, 300); };

  const sentKey = SENTIMENT[data?.sentiment?.toLowerCase()] ? data.sentiment.toLowerCase() : "neutral";
  const sent    = SENTIMENT[sentKey];
  const isProfit = data?.isProfit ?? (trade.price >= trade.avgBuyPrice);
  const pnlColor = isProfit ? "#10b981" : "#f43f5e";
  const pnlBg   = isProfit ? "#ecfdf5" : "#fff1f2";

  return (
    <>
      <style>{`
        @keyframes summarySlideIn  { from { opacity:0; transform:translateX(110%); } to { opacity:1; transform:translateX(0); } }
        @keyframes summarySlideOut { from { opacity:1; transform:translateX(0); }   to { opacity:0; transform:translateX(110%); } }
        @keyframes summaryShimmer  { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }
        @keyframes summaryFadeIn   { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .summary-close:hover { background:#f1f5f9 !important; }
        /* ── Responsive ── */
        @media (max-width: 480px) {
          .trade-summary-card {
            bottom: 0 !important; right: 0 !important; left: 0 !important;
            width: 100% !important; max-width: 100% !important;
            border-radius: 18px 18px 0 0 !important;
          }
        }
        @media (min-width: 481px) and (max-width: 768px) {
          .trade-summary-card {
            width: calc(100vw - 32px) !important;
            max-width: 390px !important;
            right: 16px !important; bottom: 90px !important;
          }
        }
      `}</style>

      <div
        className="trade-summary-card"
        style={{
          position: "fixed", bottom: 100, right: 28, width: 370,
          background: "#fff", borderRadius: 18, zIndex: 10000,
          boxShadow: "0 20px 60px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.08)",
          border: "1px solid #e2e8f0", overflow: "hidden",
          animation: visible
            ? "summarySlideIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards"
            : "summarySlideOut 0.3s ease forwards",
        }}
      >
        {/* Top accent bar */}
        <div style={{ height: 4, background: isProfit ? "linear-gradient(90deg,#10b981,#059669)" : "linear-gradient(90deg,#f43f5e,#e11d48)" }} />

        {/* Header */}
        <div style={{ padding: "14px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: pnlBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              {isProfit ? "💰" : "📉"}
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Kite AI · Trade Summary
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e", marginTop: 1 }}>
                {trade.stockName}
                <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: "#fff1f2", color: "#f43f5e" }}>
                  SOLD {trade.qty}
                </span>
              </div>
            </div>
          </div>
          <button className="summary-close" onClick={handleClose}
            style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", fontSize: 14, color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.15s ease" }}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "14px 16px 16px" }}>
          {loading ? (
            <div>
              {[70, 100, 55, 85, 65].map((w, i) => (
                <div key={i} style={{ height: i === 0 ? 16 : 12, width: `${w}%`, borderRadius: 6, marginBottom: 8, background: "linear-gradient(90deg,#f0f4f8 25%,#e2e8f0 50%,#f0f4f8 75%)", backgroundSize: "800px 100%", animation: "summaryShimmer 1.5s infinite linear" }} />
              ))}
              <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 10 }}>✦ Calculating your trade...</div>
            </div>
          ) : (
            <div style={{ animation: "summaryFadeIn 0.4s ease" }}>

              {/* ── Realized P&L — the hero number ── */}
              <div style={{ background: pnlBg, borderRadius: 12, padding: "14px 16px", marginBottom: 12, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Realized P&L
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: pnlColor, lineHeight: 1 }}>
                  {data.isProfit ? "+" : ""}₹{Math.abs(data.totalPnl).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 12, color: pnlColor, marginTop: 4, fontWeight: 600 }}>
                  {data.isProfit ? "▲" : "▼"} {Math.abs(data.pnlPct)}% · {data.isProfit ? "+" : ""}₹{data.pnlPerShare.toFixed(2)}/share
                </div>
              </div>

              {/* ── Trade details row ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
                {[
                  { label: "Bought at", value: `₹${data.avgBuyPrice.toFixed(2)}` },
                  { label: "Sold at",   value: `₹${data.sellPrice.toFixed(2)}`   },
                  { label: "Qty sold",  value: `${data.qty} shares`              },
                  { label: "Total proceeds", value: `₹${(data.qty * data.sellPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
                ].map((item) => (
                  <div key={item.label} style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500, marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* ── Sentiment badge ── */}
              <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, background: sent.bg, fontSize: 12, fontWeight: 600, color: sent.color }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: sent.dot }} />
                  {sent.label} outlook
                </div>
              </div>

              {/* ── AI Opinion on timing ── */}
              <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#374151", lineHeight: 1.6, marginBottom: 10, borderLeft: "3px solid #387ed1" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>AI Opinion on your timing</div>
                {data.opinion}
              </div>

              {/* ── Re-entry suggestion ── */}
              <div style={{ fontSize: 12, color: "#64748b", padding: "8px 10px", background: "#fffbeb", borderRadius: 8, border: "1px solid #fde68a", marginBottom: 10, display: "flex", gap: 6, alignItems: "flex-start" }}>
                <span style={{ fontSize: 14 }}>🎯</span>
                <span>{data.reentry}</span>
              </div>

              {/* ── Tax estimate ── */}
              {data.isProfit && (
                <div style={{ background: "#f0f4ff", borderRadius: 10, padding: "10px 12px", marginBottom: 12, border: "1px solid #c7d2fe" }}>
                  <div style={{ fontSize: 10, color: "#4f46e5", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>📋 Estimated Tax on Gains</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <div style={{ background: "#fff", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 3 }}>STCG (held &lt;1 yr)</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#4f46e5" }}>₹{data.stcg.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                      <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>@ 15% flat</div>
                    </div>
                    <div style={{ background: "#fff", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 3 }}>LTCG (held &gt;1 yr)</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#059669" }}>₹{data.ltcg.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                      <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>@ 10% above ₹1L</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: "#818cf8", marginTop: 8, textAlign: "center" }}>
                    * Estimated only. Consult a CA for exact liability.
                  </div>
                </div>
              )}

              {/* Footer */}
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