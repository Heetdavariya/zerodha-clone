import { useEffect, useState, useContext, useRef } from "react";
import api from "../utils/api";
import GeneralContext from "../context/GeneralContext";
import useLivePrices from "../hooks/useLivePrices";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement,
  Tooltip, Legend, Filler
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Filler);

export default function Positions() {
  const { refreshCount, openBuyWindow, openSellWindow } = useContext(GeneralContext);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flashMap, setFlashMap] = useState({});
  const [activeChart, setActiveChart] = useState("pnl"); // "pnl" | "ltp"
  const prevPrices = useRef({});
  const { prices } = useLivePrices();

  const load = () => {
    api.get("/dashboard/positions")
      .then(({ data }) => setPositions(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [refreshCount]);

  // Merge live prices + flash
  useEffect(() => {
    if (!prices || Object.keys(prices).length === 0) return;
    setPositions((prev) =>
      prev.map((p) => {
        const live = prices[p.name];
        if (!live) return p;
        const old = prevPrices.current[p.name];
        if (old !== undefined && old !== live.price) {
          const dir = live.price > old ? "up" : "down";
          setFlashMap((f) => ({ ...f, [p.name]: dir }));
          setTimeout(() => setFlashMap((f) => ({ ...f, [p.name]: null })), 600);
        }
        prevPrices.current[p.name] = live.price;
        return { ...p, price: live.price };
      })
    );
  }, [prices]);

  const totalPnl = positions.reduce((s, p) => s + (p.price - p.avg) * p.qty, 0);

  // ── Chart data ──────────────────────────────────────────
  const pnlValues = positions.map((p) =>
    parseFloat(((p.price - p.avg) * p.qty).toFixed(2))
  );

  const pnlChartData = {
    labels: positions.map((p) => p.name),
    datasets: [{
      label: "P&L (₹)",
      data: pnlValues,
      backgroundColor: pnlValues.map((v) =>
        v >= 0 ? "rgba(39,174,96,0.75)" : "rgba(231,76,60,0.75)"
      ),
      borderColor: pnlValues.map((v) =>
        v >= 0 ? "#1e8449" : "#c0392b"
      ),
      borderWidth: 1.5,
      borderRadius: 6,
    }],
  };

  const ltpChartData = {
    labels: positions.map((p) => p.name),
    datasets: [
      {
        label: "Avg Buy Price (₹)",
        data: positions.map((p) => p.avg),
        borderColor: "#387ed1",
        backgroundColor: "rgba(56,126,209,0.08)",
        pointBackgroundColor: "#387ed1",
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.35,
        fill: false,
      },
      {
        label: "Live Price (₹)",
        data: positions.map((p) => p.price),
        borderColor: "#27ae60",
        backgroundColor: "rgba(39,174,96,0.08)",
        pointBackgroundColor: positions.map((p) =>
          p.price >= p.avg ? "#27ae60" : "#e74c3c"
        ),
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.35,
        fill: false,
      },
    ],
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: activeChart === "ltp",
        position: "top",
        labels: { font: { size: 12 }, boxWidth: 12, padding: 16 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            ` ₹${ctx.raw.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { font: { size: 11 }, maxRotation: 30 },
        grid: { display: false },
      },
      y: {
        ticks: {
          font: { size: 11 },
          callback: (v) => `₹${v.toLocaleString("en-IN")}`,
        },
        grid: { color: "#f0f0f0" },
      },
    },
  };

  // extra zero-line for P&L chart
  const pnlOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      legend: { display: false },
      annotation: undefined,
    },
    scales: {
      ...commonOptions.scales,
      y: {
        ...commonOptions.scales.y,
        grid: {
          color: (ctx) =>
            ctx.tick.value === 0 ? "rgba(0,0,0,0.25)" : "#f0f0f0",
          lineWidth: (ctx) => (ctx.tick.value === 0 ? 2 : 1),
        },
      },
    },
  };

  if (loading) return (
    <div className="page-loader" style={{ minHeight: 300 }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontSize: "clamp(16px, 4vw, 22px)", fontWeight: 700 }}>
          Positions ({positions.length})
        </h2>
        {positions.length > 0 && (
          <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Total P&amp;L:{" "}
            <span style={{ fontWeight: 700, color: totalPnl >= 0 ? "var(--zerodha-green)" : "var(--zerodha-red)" }}>
              {totalPnl >= 0 ? "+" : ""}₹{totalPnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>

      {positions.length === 0 ? (
        <div className="empty-state">
          <i className="fa fa-exchange-alt" />
          <p>No open positions. Intraday trades will appear here.</p>
        </div>
      ) : (
        <>
          {/* ── Chart Card ─────────────────────────────── */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header" style={{ flexWrap: "wrap", gap: 10 }}>
              {/* Tab switcher */}
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span className="card-title">Live Chart</span>
                <span style={{
                  display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                  background: "#22c55e",
                  boxShadow: "0 0 6px #22c55e",
                  animation: "pulse 1.5s infinite",
                  marginLeft: 4,
                }} />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { key: "pnl", label: "P&L Bar" },
                  { key: "ltp", label: "Avg vs LTP" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveChart(tab.key)}
                    style={{
                      padding: "5px 14px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: 12,
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      background: activeChart === tab.key ? "var(--zerodha-blue)" : "var(--bg-secondary)",
                      color: activeChart === tab.key ? "#fff" : "var(--text-secondary)",
                      transition: "var(--transition)",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="card-body">
              {/* Legend for P&L chart */}
              {activeChart === "pnl" && (
                <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 12, color: "var(--text-muted)", flexWrap: "wrap" }}>
                  <span>
                    <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "rgba(39,174,96,0.75)", marginRight: 5 }} />
                    Profit
                  </span>
                  <span>
                    <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "rgba(231,76,60,0.75)", marginRight: 5 }} />
                    Loss
                  </span>
                  <span style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: 11 }}>
                    <i className="fa fa-sync-alt" style={{ marginRight: 4 }} />
                    Updates live every second
                  </span>
                </div>
              )}

              {/* Chart container — responsive height */}
              <div style={{ height: "clamp(180px, 30vw, 260px)", position: "relative" }}>
                {activeChart === "pnl" ? (
                  <Bar data={pnlChartData} options={pnlOptions} />
                ) : (
                  <Line data={ltpChartData} options={commonOptions} />
                )}
              </div>

              {/* Summary strip below chart */}
              <div style={{
                display: "flex", gap: 8, marginTop: 16,
                flexWrap: "wrap",
              }}>
                {positions.map((p) => {
                  const pnl = (p.price - p.avg) * p.qty;
                  const flash = flashMap[p.name];
                  return (
                    <div key={p._id} style={{
                      flex: "1 1 auto",
                      minWidth: 100,
                      background: pnl >= 0 ? "rgba(39,174,96,0.06)" : "rgba(231,76,60,0.06)",
                      border: `1px solid ${pnl >= 0 ? "rgba(39,174,96,0.2)" : "rgba(231,76,60,0.2)"}`,
                      borderRadius: "var(--radius-sm)",
                      padding: "8px 12px",
                      textAlign: "center",
                      transition: "background 0.3s",
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>{p.name}</div>
                      <div style={{
                        fontSize: 13, fontWeight: 700,
                        color: flash === "up" ? "var(--zerodha-green)" : flash === "down" ? "var(--zerodha-red)" : (pnl >= 0 ? "var(--zerodha-green)" : "var(--zerodha-red)"),
                        transition: "color 0.3s",
                        marginTop: 2,
                      }}>
                        ₹{p.price.toFixed(2)}
                        {flash && <span style={{ fontSize: 10, marginLeft: 3 }}>{flash === "up" ? "▲" : "▼"}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: pnl >= 0 ? "var(--zerodha-green)" : "var(--zerodha-red)", marginTop: 1 }}>
                        {pnl >= 0 ? "+" : ""}₹{Math.abs(pnl).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Table Card ──────────────────────────────── */}
          <div className="card">
            <div className="table-wrap">
              <table style={{ tableLayout: "fixed", minWidth: 600 }}>
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>Product</th>
                    <th style={{ width: 120 }}>Stock</th>
                    <th style={{ width: 60 }}>Qty</th>
                    <th style={{ width: 100 }}>Avg</th>
                    <th style={{ width: 120 }}>LTP</th>
                    <th style={{ width: 120 }}>P&amp;L</th>
                    <th style={{ width: 90 }}>Change</th>
                    <th style={{ width: 140 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => {
                    const pnl = (p.price - p.avg) * p.qty;
                    const flash = flashMap[p.name];
                    return (
                      <tr
                        key={p._id}
                        style={{
                          transition: "background 0.3s",
                          background: flash === "up" ? "rgba(34,197,94,0.10)" : flash === "down" ? "rgba(239,68,68,0.10)" : "",
                        }}
                      >
                        <td><span className="tag">{p.product}</span></td>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td>{p.qty}</td>
                        <td>₹{p.avg.toFixed(2)}</td>
                        <td style={{ fontWeight: 700, transition: "color 0.3s", color: flash === "up" ? "var(--zerodha-green)" : flash === "down" ? "var(--zerodha-red)" : "inherit" }}>
                          ₹{p.price.toFixed(2)}
                          {flash && <span style={{ marginLeft: 4, fontSize: 11 }}>{flash === "up" ? "▲" : "▼"}</span>}
                        </td>
                        <td className={pnl >= 0 ? "gain" : "loss"}>
                          {pnl >= 0 ? "+" : ""}₹{Math.abs(pnl).toFixed(2)}
                        </td>
                        <td className={p.isLoss ? "loss" : "gain"}>{p.day}</td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="btn btn-sm btn-primary" onClick={() => openBuyWindow(p.name)}>Buy</button>
                            <button className="btn btn-sm btn-danger" onClick={() => openSellWindow(p.name)}>Sell</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pulse animation */}
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.5; transform: scale(1.3); }
            }
          `}</style>
        </>
      )}
    </div>
  );
}