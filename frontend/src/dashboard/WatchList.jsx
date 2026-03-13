import { useEffect, useState, useContext, useRef } from "react";
import api from "../utils/api";
import GeneralContext from "../context/GeneralContext";
import useLivePrices from "../hooks/useLivePrices";

export default function WatchList() {
  const [list, setList] = useState([]);
  const [flashMap, setFlashMap] = useState({});
  const prevPrices = useRef({});
  const { openBuyWindow, openSellWindow, refreshCount, triggerRefresh } = useContext(GeneralContext);
  const { prices } = useLivePrices();

  const load = async () => {
    try { const { data } = await api.get("/dashboard/watchlist"); setList(data); } catch {}
  };

  useEffect(() => { load(); }, [refreshCount]);

  // Merge live prices into list + trigger color flash
  useEffect(() => {
    if (!prices || Object.keys(prices).length === 0) return;
    setList((prev) =>
      prev.map((item) => {
        const live = prices[item.name];
        if (!live) return item;

        const oldPrice = prevPrices.current[item.name];
        if (oldPrice !== undefined && oldPrice !== live.price) {
          const dir = live.price > oldPrice ? "up" : "down";
          setFlashMap((f) => ({ ...f, [item.name]: dir }));
          setTimeout(() => setFlashMap((f) => ({ ...f, [item.name]: null })), 600);
        }
        prevPrices.current[item.name] = live.price;

        return {
          ...item,
          price: live.price,
          change: live.change,
          changePercent: live.changePercent,
          isDown: live.isDown,
        };
      })
    );
  }, [prices]);

  const remove = async (id) => {
    try {
      await api.delete(`/dashboard/watchlist/${id}`);
      triggerRefresh();
    } catch {}
  };

  return (
    <div className="watchlist-panel">
      <div className="watchlist-header">
        <h3>Watchlist</h3>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {list.length === 0 ? (
          <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            <i className="fa fa-eye" style={{ fontSize: 24, display: "block", marginBottom: 8, opacity: 0.4 }} />
            <div>No stocks yet</div>
            <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.5 }}>
              Go to <strong>Markets</strong> page and click <strong>+ Watch</strong> on any stock
            </div>
          </div>
        ) : list.map((item) => {
          const flash = flashMap[item.name];
          return (
            <div
              className="watchlist-item"
              key={item._id}
              style={{
                transition: "background 0.3s",
                background: flash === "up" ? "rgba(34,197,94,0.12)" : flash === "down" ? "rgba(239,68,68,0.12)" : "",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div className="stock-name">{item.name}</div>
                  <div className="stock-price" style={{ color: item.isDown ? "var(--zerodha-red)" : "var(--zerodha-green)", transition: "color 0.3s" }}>
                    ₹{item.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    {flash && (
                      <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.8 }}>
                        {flash === "up" ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                  <div className={`stock-change ${item.isDown ? "loss" : "gain"}`}>{item.changePercent}</div>
                </div>
                <div className="watchlist-actions">
                  <button className="wl-btn wl-buy" onClick={() => openBuyWindow(item.name)} title="Buy">B</button>
                  <button className="wl-btn wl-sell" onClick={() => openSellWindow(item.name)} title="Sell">S</button>
                  <button className="wl-btn" style={{ background: "#f5f5f5", color: "#999" }} onClick={() => remove(item._id)} title="Remove">✕</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
        <i className="fa fa-info-circle" style={{ marginRight: 4 }} />
        Add stocks from the <strong>Markets</strong> page
      </div>
    </div>
  );
}