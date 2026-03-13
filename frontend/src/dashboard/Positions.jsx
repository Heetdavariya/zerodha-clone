import { useEffect, useState, useContext, useRef } from "react";
import api from "../utils/api";
import GeneralContext from "../context/GeneralContext";
import useLivePrices from "../hooks/useLivePrices";

export default function Positions() {
  const { refreshCount, openBuyWindow, openSellWindow } = useContext(GeneralContext);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flashMap, setFlashMap] = useState({});
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

  if (loading) return <div className="page-loader" style={{ minHeight: 300 }}><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Positions ({positions.length})</h2>
        {positions.length > 0 && (
          <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Total P&amp;L: <span style={{ fontWeight: 700, color: totalPnl >= 0 ? "var(--zerodha-green)" : "var(--zerodha-red)" }}>
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
        <div className="card">
          <div className="table-wrap">
            <table style={{ tableLayout: "fixed" }}>
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
      )}
    </div>
  );
}