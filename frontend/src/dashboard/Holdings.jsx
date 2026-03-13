import { useEffect, useState, useContext, useRef } from "react";
import api from "../utils/api";
import GeneralContext from "../context/GeneralContext";
import useLivePrices from "../hooks/useLivePrices";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function Holdings() {
  const { refreshCount, openBuyWindow, openSellWindow } = useContext(GeneralContext);
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flashMap, setFlashMap] = useState({});
  const prevPrices = useRef({});
  const { prices } = useLivePrices();

  const load = () => {
    api.get("/dashboard/holdings")
      .then(({ data }) => setHoldings(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [refreshCount]);

  // Merge live prices into holdings + flash
  useEffect(() => {
    if (!prices || Object.keys(prices).length === 0) return;
    setHoldings((prev) =>
      prev.map((h) => {
        const live = prices[h.name];
        if (!live) return h;

        const old = prevPrices.current[h.name];
        if (old !== undefined && old !== live.price) {
          const dir = live.price > old ? "up" : "down";
          setFlashMap((f) => ({ ...f, [h.name]: dir }));
          setTimeout(() => setFlashMap((f) => ({ ...f, [h.name]: null })), 600);
        }
        prevPrices.current[h.name] = live.price;

        return { ...h, price: live.price };
      })
    );
  }, [prices]);

  const totalInvested = holdings.reduce((s, h) => s + h.avg * h.qty, 0);
  const totalCurrent = holdings.reduce((s, h) => s + h.price * h.qty, 0);
  const totalPnl = totalCurrent - totalInvested;

  const pnlValues = holdings.map((h) => parseFloat(((h.price - h.avg) * h.qty).toFixed(2)));

  const barData = {
    labels: holdings.map((h) => h.name),
    datasets: [{
      label: "P&L (₹)",
      data: pnlValues,
      backgroundColor: pnlValues.map((v) => v >= 0 ? "rgba(34,197,94,0.75)" : "rgba(239,68,68,0.75)"),
      borderColor: pnlValues.map((v) => v >= 0 ? "#16a34a" : "#dc2626"),
      borderWidth: 1.5,
      borderRadius: 6,
    }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ₹${ctx.raw.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        },
      },
    },
    scales: {
      x: { ticks: { font: { size: 11 } }, grid: { display: false } },
      y: {
        ticks: { font: { size: 11 }, callback: (v) => `₹${v.toLocaleString("en-IN")}` },
        grid: { color: "#f0f0f0" },
      },
    },
  };

  if (loading) return <div className="page-loader" style={{ minHeight: 300 }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontSize: "clamp(16px, 4vw, 22px)", fontWeight: 700 }}>Holdings ({holdings.length})</h2>
        <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          P&amp;L: <span style={{ fontWeight: 700, color: totalPnl >= 0 ? "var(--zerodha-green)" : "var(--zerodha-red)" }}>
            {totalPnl >= 0 ? "+" : ""}₹{totalPnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {holdings.length === 0 ? (
        <div className="empty-state">
          <i className="fa fa-briefcase" />
          <p>No holdings yet. Buy stocks to see them here.</p>
        </div>
      ) : (
        <>
          {/* P&L Bar Chart */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title">P&amp;L per stock</span>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-muted)" }}>
                <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "rgba(34,197,94,0.75)", marginRight: 5 }} />Profit</span>
                <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "rgba(239,68,68,0.75)", marginRight: 5 }} />Loss</span>
              </div>
            </div>
            <div className="card-body">
              <div style={{ height: 220 }}>
                <Bar data={barData} options={barOptions} />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card">
            <div className="table-wrap">
              <table style={{ tableLayout: "fixed", minWidth: 700 }}>
                <thead>
                  <tr>
                    <th style={{ width: 110 }}>Stock</th>
                    <th style={{ width: 55 }}>Qty</th>
                    <th style={{ width: 105 }}>Avg cost</th>
                    <th style={{ width: 120 }}>LTP</th>
                    <th style={{ width: 130 }}>Invested</th>
                    <th style={{ width: 130 }}>Current</th>
                    <th style={{ width: 120 }}>P&amp;L</th>
                    <th style={{ width: 75 }}>Day</th>
                    <th style={{ width: 130 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => {
                    const invested = h.avg * h.qty;
                    const current = h.price * h.qty;
                    const pnl = current - invested;
                    const pnlPct = ((pnl / invested) * 100).toFixed(2);
                    const flash = flashMap[h.name];
                    return (
                      <tr
                        key={h._id}
                        style={{
                          transition: "background 0.3s",
                          background: flash === "up" ? "rgba(34,197,94,0.10)" : flash === "down" ? "rgba(239,68,68,0.10)" : "",
                        }}
                      >
                        <td style={{ fontWeight: 600 }}>{h.name}</td>
                        <td>{h.qty}</td>
                        <td>₹{h.avg.toFixed(2)}</td>
                        <td style={{ fontWeight: 700, color: flash === "up" ? "var(--zerodha-green)" : flash === "down" ? "var(--zerodha-red)" : "inherit", transition: "color 0.3s" }}>
                          ₹{h.price.toFixed(2)}
                          {flash && <span style={{ marginLeft: 4, fontSize: 11 }}>{flash === "up" ? "▲" : "▼"}</span>}
                        </td>
                        <td>₹{invested.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        <td>₹{current.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        <td className={pnl >= 0 ? "gain" : "loss"}>
                          {pnl >= 0 ? "+" : ""}₹{Math.abs(pnl).toFixed(2)}<br />
                          <span style={{ fontSize: 11, fontWeight: 400 }}>({pnlPct}%)</span>
                        </td>
                        <td className={h.isLoss ? "loss" : "gain"}>{h.day}</td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="btn btn-sm btn-primary" onClick={() => openBuyWindow(h.name)}>Buy</button>
                            <button className="btn btn-sm btn-danger" onClick={() => openSellWindow(h.name)}>Sell</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 16, fontSize: 13, flexWrap: "wrap" }}>
              <span>Invested: <strong>₹{totalInvested.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></span>
              <span>Current: <strong>₹{totalCurrent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></span>
              <span>P&amp;L: <strong className={totalPnl >= 0 ? "gain" : "loss"}>{totalPnl >= 0 ? "+" : ""}₹{totalPnl.toFixed(2)}</strong></span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}