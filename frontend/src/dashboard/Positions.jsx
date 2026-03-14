// frontend/src/dashboard/Positions.jsx
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
  const [activeChart, setActiveChart] = useState("pnl");
  const prevPrices = useRef({});
  const { prices } = useLivePrices();

  const load = () => {
    api.get("/dashboard/positions")
      .then(({ data }) => setPositions(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [refreshCount]);

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

  const pnlValues = positions.map((p) => parseFloat(((p.price - p.avg) * p.qty).toFixed(2)));

  const pnlChartData = {
    labels: positions.map((p) => p.name),
    datasets: [{
      label: "P&L (₹)",
      data: pnlValues,
      backgroundColor: pnlValues.map((v) => v >= 0 ? "rgba(39,174,96,0.75)" : "rgba(231,76,60,0.75)"),
      borderColor: pnlValues.map((v) => v >= 0 ? "#1e8449" : "#c0392b"),
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
        pointRadius: 5, pointHoverRadius: 7,
        tension: 0.35, fill: false,
      },
      {
        label: "Live Price (₹)",
        data: positions.map((p) => p.price),
        borderColor: "#27ae60",
        backgroundColor: "rgba(39,174,96,0.08)",
        pointBackgroundColor: positions.map((p) => p.price >= p.avg ? "#27ae60" : "#e74c3c"),
        pointRadius: 5, pointHoverRadius: 7,
        tension: 0.35, fill: false,
      },
    ],
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: activeChart === "ltp", position: "top", labels: { font: { size: 12 }, boxWidth: 12, padding: 16 } },
      tooltip: { callbacks: { label: (ctx) => ` ₹${ctx.raw.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` } },
    },
    scales: {
      x: { ticks: { font: { size: 11 }, maxRotation: 30 }, grid: { display: false } },
      y: { ticks: { font: { size: 11 }, callback: (v) => `₹${v.toLocaleString("en-IN")}` }, grid: { color: "#f0f0f0" } },
    },
  };

  const pnlOptions = {
    ...commonOptions,
    plugins: { ...commonOptions.plugins, legend: { display: false } },
    scales: {
      ...commonOptions.scales,
      y: {
        ...commonOptions.scales.y,
        grid: {
          color: (ctx) => ctx.tick.value === 0 ? "rgba(0,0,0,0.25)" : "#f0f0f0",
          lineWidth: (ctx) => ctx.tick.value === 0 ? 2 : 1,
        },
      },
    },
  };

  if (loading) return <div className="page-loader" style={{ minHeight: 300 }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontSize: "clamp(16px, 4vw, 22px)", fontWeight: 700 }}>Positions ({positions.length})</h2>
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
          <p>No open positions. Intraday (MIS) trades appear here.</p>
        </div>
      ) : (
        <>
          {/* Chart Card */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header" style={{ flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className="card-title">Live Chart</span>
                <span style={{
                  display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                  background: "#22c55e", boxShadow: "0 0 6px #22c55e",
                  animation: "pulse 1.5s infinite", marginLeft: 4,
                }} />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[{ key: "pnl", label: "P&L Bar" }, { key: "ltp", label: "Avg vs LTP" }].map((tab) => (
                  <button key={tab.key} onClick={() => setActiveChart(tab.key)} style={{
                    padding: "5px 14px", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 600,
                    border: "none", cursor: "pointer",
                    background: activeChart === tab.key ? "var(--zerodha-blue)" : "var(--bg-secondary)",
                    color: activeChart === tab.key ? "#fff" : "var(--text-secondary)",
                    transition: "var(--transition)",
                  }}>{tab.label}</button>
                ))}
              </div>
            </div>
            <div className="card-body">
              {activeChart === "pnl" && (
                <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 12, color: "var(--text-muted)", flexWrap: "wrap" }}>
                  <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "rgba(39,174,96,0.75)", marginRight: 5 }} />Profit</span>
                  <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "rgba(231,76,60,0.75)", marginRight: 5 }} />Loss</span>
                  <span style={{ marginLeft: "auto", fontSize: 11 }}><i className="fa fa-sync-alt" style={{ marginRight: 4 }} />Live every second</span>
                </div>
              )}
              <div style={{ height: "clamp(160px, 28vw, 240px)", position: "relative" }}>
                {activeChart === "pnl" ? <Bar data={pnlChartData} options={pnlOptions} /> : <Line data={ltpChartData} options={commonOptions} />}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                {positions.map((p) => {
                  const pnl = (p.price - p.avg) * p.qty;
                  const flash = flashMap[p.name];
                  return (
                    <div key={p._id} style={{
                      flex: "1 1 auto", minWidth: 90,
                      background: pnl >= 0 ? "rgba(39,174,96,0.06)" : "rgba(231,76,60,0.06)",
                      border: `1px solid ${pnl >= 0 ? "rgba(39,174,96,0.2)" : "rgba(231,76,60,0.2)"}`,
                      borderRadius: "var(--radius-sm)", padding: "8px 10px", textAlign: "center",
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700 }}>{p.name}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2, color: flash === "up" ? "var(--zerodha-green)" : flash === "down" ? "var(--zerodha-red)" : pnl >= 0 ? "var(--zerodha-green)" : "var(--zerodha-red)" }}>
                        ₹{p.price.toFixed(2)}{flash && <span style={{ fontSize: 10, marginLeft: 3 }}>{flash === "up" ? "▲" : "▼"}</span>}
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

          {/* Table Card */}
          <div className="card">
            <div className="table-wrap">
              <table style={{ minWidth: 620 }}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Stock</th>
                    <th>Qty</th>
                    <th>Avg</th>
                    <th>LTP</th>
                    <th>P&amp;L</th>
                    <th>Day Chg%</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => {
                    const pnl = (p.price - p.avg) * p.qty;
                    const dayChange = ((p.price - p.avg) / p.avg * 100).toFixed(2); // calculated from live vs avg
                    const flash = flashMap[p.name];
                    return (
                      <tr key={p._id} style={{
                        transition: "background 0.3s",
                        background: flash === "up" ? "rgba(34,197,94,0.10)" : flash === "down" ? "rgba(239,68,68,0.10)" : "",
                      }}>
                        <td><span className="tag">{p.product}</span></td>
                        <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{p.name}</td>
                        <td>{p.qty}</td>
                        <td style={{ whiteSpace: "nowrap" }}>₹{p.avg.toFixed(2)}</td>
                        <td style={{ fontWeight: 700, whiteSpace: "nowrap", transition: "color 0.3s", color: flash === "up" ? "var(--zerodha-green)" : flash === "down" ? "var(--zerodha-red)" : "inherit" }}>
                          ₹{p.price.toFixed(2)}{flash && <span style={{ marginLeft: 4, fontSize: 10 }}>{flash === "up" ? "▲" : "▼"}</span>}
                        </td>
                        <td className={pnl >= 0 ? "gain" : "loss"} style={{ whiteSpace: "nowrap" }}>
                          {pnl >= 0 ? "+" : ""}₹{Math.abs(pnl).toFixed(2)}
                        </td>
                        {/* Day Change — calculated from live price vs avg; shows real movement */}
                        <td className={parseFloat(dayChange) >= 0 ? "gain" : "loss"} style={{ whiteSpace: "nowrap" }}>
                          {parseFloat(dayChange) >= 0 ? "+" : ""}{dayChange}%
                        </td>
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