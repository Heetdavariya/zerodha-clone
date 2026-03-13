import { useEffect, useState, useContext, useRef } from "react";
import api from "../utils/api";
import useLivePrices from "../hooks/useLivePrices";
import GeneralContext from "../context/GeneralContext";
import { Link } from "react-router-dom";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Summary() {
  const { refreshCount } = useContext(GeneralContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { prices } = useLivePrices();
  const prevPrices = useRef({});

  useEffect(() => {
    api.get("/dashboard/summary")
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false));
  }, [refreshCount]);

  useEffect(() => {
    if (!prices || Object.keys(prices).length === 0) return;
    setData((prev) => {
      if (!prev?.holdings?.length) return prev;
      let liveCurrentValue = 0;
      for (const h of prev.holdings) {
        const live = prices[h.name];
        liveCurrentValue += (live ? live.price : h.price) * h.qty;
      }
      const livePnl = parseFloat((liveCurrentValue - prev.investedValue).toFixed(2));
      const livePnlPct = prev.investedValue
        ? parseFloat(((livePnl / prev.investedValue) * 100).toFixed(2))
        : 0;
      return { ...prev, currentValue: liveCurrentValue, totalPnl: livePnl, totalPnlPercent: livePnlPct };
    });
  }, [prices]);

  if (loading) return <div className="page-loader" style={{ minHeight: 300 }}><div className="spinner" /></div>;

  const pnlPositive = data?.totalPnl >= 0;
  const funds = data?.funds || 0;
  const invested = data?.investedValue || 0;
  const pnl = data?.totalPnl || 0;
  const hasData = funds > 0 || invested > 0;

  const donutData = {
    labels: ["Available Funds", "Invested", pnl >= 0 ? "Profit" : "Loss"],
    datasets: [{
      data: [Math.max(funds, 0), Math.max(invested, 0), Math.abs(pnl)],
      backgroundColor: ["#387ed1", "#f59e0b", pnl >= 0 ? "#22c55e" : "#ef4444"],
      borderColor: ["#fff", "#fff", "#fff"],
      borderWidth: 3,
      hoverOffset: 8,
    }],
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ₹${ctx.raw.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        },
      },
    },
  };

  return (
    <div>
      <h2 style={{ fontSize: "clamp(18px, 4vw, 22px)", fontWeight: 700, marginBottom: 20 }}>Portfolio overview</h2>

      {/* Stat cards */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="label">Available funds</div>
          <div className="value" style={{ color: "var(--zerodha-blue)" }}>
            ₹{funds.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="change">
            <Link to="/dashboard/funds" style={{ color: "var(--zerodha-blue)", fontSize: 12 }}>Add funds →</Link>
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Invested value</div>
          <div className="value">₹{invested.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="stat-card">
          <div className="label">Current value</div>
          <div className="value">₹{(data?.currentValue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total P&amp;L</div>
          <div className="value" style={{ color: pnlPositive ? "var(--zerodha-green)" : "var(--zerodha-red)" }}>
            {pnlPositive ? "+" : ""}₹{pnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className={`change ${pnlPositive ? "up" : "down"}`}>
            {pnlPositive ? "▲" : "▼"} {Math.abs(data?.totalPnlPercent || 0)}%
          </div>
        </div>
      </div>

      {/* Chart row — responsive via CSS class */}
      <div className="summary-chart-row" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 16 }}>

        {/* Donut Chart */}
        <div className="card">
          <div className="card-header"><span className="card-title">Portfolio breakdown</span></div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {!hasData ? (
              <div style={{ padding: "30px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                <i className="fa fa-chart-pie" style={{ fontSize: 32, opacity: 0.3, display: "block", marginBottom: 10 }} />
                Add funds and buy stocks to see your breakdown
              </div>
            ) : (
              <>
                <div style={{ position: "relative", width: 160, height: 160 }}>
                  <Doughnut data={donutData} options={donutOptions} />
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Total</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>
                      ₹{(funds + invested).toLocaleString("en-IN", { notation: "compact", maximumFractionDigits: 1 })}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 14, width: "100%" }}>
                  {[
                    { label: "Available funds", value: funds, color: "#387ed1" },
                    { label: "Invested", value: invested, color: "#f59e0b" },
                    { label: pnl >= 0 ? "Profit" : "Loss", value: Math.abs(pnl), color: pnl >= 0 ? "#22c55e" : "#ef4444" },
                  ].map((item) => (
                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", fontSize: 13, borderBottom: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                        <span style={{ color: "var(--text-secondary)" }}>{item.label}</span>
                      </div>
                      <strong>₹{item.value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recent orders */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent orders</span>
            <Link to="/dashboard/orders" style={{ fontSize: 13, color: "var(--zerodha-blue)" }}>View all →</Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {!data?.recentOrders?.length ? (
              <p style={{ padding: 20, color: "var(--text-muted)", fontSize: 14 }}>No orders yet.</p>
            ) : data.recentOrders.map((o) => (
              <div key={o._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{o.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{o.qty} shares · ₹{o.price}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <span className={`badge badge-${o.mode.toLowerCase()}`}>{o.mode}</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>₹{(o.qty * o.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Holdings + Positions */}
      <div className="summary-bottom-row" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Holdings ({data?.holdingsCount || 0})</span>
            <Link to="/dashboard/holdings" style={{ fontSize: 13, color: "var(--zerodha-blue)" }}>View all →</Link>
          </div>
          <div className="card-body" style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            {data?.holdingsCount > 0
              ? <>You own <strong>{data.holdingsCount}</strong> stocks worth <strong>₹{invested.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></>
              : "No holdings yet. Go to Markets to buy stocks."}
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Positions ({data?.positionsCount || 0})</span>
            <Link to="/dashboard/positions" style={{ fontSize: 13, color: "var(--zerodha-blue)" }}>View all →</Link>
          </div>
          <div className="card-body" style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            {data?.positionsCount > 0
              ? <>You have <strong>{data.positionsCount}</strong> open intraday positions.</>
              : "No open positions. Buy with MIS product for intraday trades."}
          </div>
        </div>
      </div>
    </div>
  );
}
