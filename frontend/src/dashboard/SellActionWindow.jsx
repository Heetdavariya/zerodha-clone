// frontend/src/dashboard/SellActionWindow.jsx
import { useState, useEffect, useContext } from "react";
import api from "../utils/api";
import StockSearch from "../components/StockSearch";
import GeneralContext from "../context/GeneralContext";

export default function SellActionWindow({ stockName, onClose }) {
  const [form, setForm]             = useState({ name: stockName || "", qty: 1, price: "", orderType: "MARKET", product: "CNC", exchange: "NSE" });
  const [loading, setLoading]       = useState(false);
  const [msg, setMsg]               = useState(null);
  const [holding, setHolding]       = useState(null);
  const [stockSelected, setStockSelected] = useState(!!stockName);
  const { triggerRefresh }          = useContext(GeneralContext);

  useEffect(() => {
    if (stockName) {
      api.get("/dashboard/holdings").then(({ data }) => {
        const h = data.find((x) => x.name === stockName);
        if (h) { setHolding(h); setForm((p) => ({ ...p, price: h.price.toString() })); }
      });
    }
  }, [stockName]);

  const total = (parseFloat(form.qty) || 0) * (parseFloat(form.price) || 0);

  const handleStockSelect = (stock) => {
    if (stock) {
      setForm((p) => ({ ...p, name: stock.symbol, price: stock.price.toString(), exchange: stock.exchange }));
      setStockSelected(true);
      api.get("/dashboard/holdings").then(({ data }) => {
        setHolding(data.find((x) => x.name === stock.symbol) || null);
      });
    } else {
      setForm((p) => ({ ...p, name: "", price: "" }));
      setStockSelected(false);
      setHolding(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !stockSelected)   { setMsg({ type: "error", text: "Please select a valid stock." }); return; }
    if (!form.price || form.price <= 0) { setMsg({ type: "error", text: "Enter a valid price." }); return; }
    if (!form.qty   || form.qty   <= 0) { setMsg({ type: "error", text: "Enter a valid quantity." }); return; }
    setLoading(true); setMsg(null);
    try {
      const { data } = await api.post("/dashboard/orders", { ...form, mode: "SELL", qty: parseInt(form.qty), price: parseFloat(form.price) });
      const qty = parseInt(form.qty);
      const price = parseFloat(form.price);
      const totalAmt = (qty * price).toLocaleString("en-IN", { minimumFractionDigits: 2 });
      setMsg({ type: "success", text: `✅ Sold ${qty} share${qty > 1 ? "s" : ""} of ${form.name} @ ₹${price} — ₹${totalAmt} credited.` });
      triggerRefresh();
      setTimeout(() => onClose(true), 2000); // show message for 2s before closing
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Order failed." });
    } finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        .sell-window { width: 460px; }
        @media (max-width: 480px) {
          .sell-window { width: 100% !important; border-radius: 16px 16px 0 0 !important; }
        }
        @media (min-width: 481px) and (max-width: 768px) {
          .sell-window { width: calc(100vw - 32px) !important; max-width: 460px !important; }
        }
      `}</style>

      <div className="action-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="action-window sell sell-window" style={{ borderRadius: "16px 16px 0 0", padding: 28, background: "#fff", boxShadow: "0 -4px 30px rgba(0,0,0,0.15)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ color: "var(--zerodha-red)", margin: 0 }}>
              Sell {form.name && <span style={{ fontWeight: 400, fontSize: 16 }}>— {form.name}</span>}
            </h3>
            <button onClick={() => onClose()} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--text-muted)" }}>✕</button>
          </div>

          {holding ? (
            <div style={{ background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: "var(--radius-sm)", padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
              <span style={{ color: "var(--text-secondary)" }}>You hold: </span>
              <strong>{holding.qty} shares</strong> of {holding.name} · avg ₹{holding.avg}
            </div>
          ) : stockSelected && form.name && (
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "var(--radius-sm)", padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#92400e" }}>
              <i className="fa fa-exclamation-triangle" style={{ marginRight: 6 }} />
              You don't hold any shares of {form.name}
            </div>
          )}

          {msg && (
            <div className={`alert alert-${msg.type}`} style={{ marginBottom: 14 }}>
              <i className={`fa fa-${msg.type === "success" ? "check-circle" : "exclamation-circle"}`} />
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Search stock <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: 12 }}>(type to search NSE stocks)</span></label>
              <StockSearch value={form.name} onChange={handleStockSelect} placeholder="e.g. INFY, TCS, RELIANCE..." disabled={!!stockName} />
            </div>
            <div className="action-form-row">
              <div className="form-group">
                <label>Order type</label>
                <select className="form-control" value={form.orderType} onChange={(e) => setForm((p) => ({ ...p, orderType: e.target.value }))}>
                  <option>MARKET</option><option>LIMIT</option><option>SL</option>
                </select>
              </div>
              <div className="form-group">
                <label>Product</label>
                <select className="form-control" value={form.product} onChange={(e) => setForm((p) => ({ ...p, product: e.target.value }))}>
                  <option>CNC</option><option>MIS</option><option>NRML</option>
                </select>
              </div>
            </div>
            <div className="action-form-row">
              <div className="form-group">
                <label>Quantity {holding && <span style={{ color: "var(--text-muted)", fontSize: 11 }}>max {holding.qty}</span>}</label>
                <input type="number" className="form-control" min="1" max={holding?.qty} value={form.qty} onChange={(e) => setForm((p) => ({ ...p, qty: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Price (₹)</label>
                <input type="number" className="form-control" min="0.01" step="0.01" placeholder="0.00" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
              </div>
            </div>
            <div className="action-summary">
              <div className="row"><span>Estimated proceeds</span><strong>₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></div>
              {holding && form.price && (
                <div className="row" style={{ marginTop: 8 }}>
                  <span>Estimated P&L</span>
                  <strong style={{ color: parseFloat(form.price) >= parseFloat(holding.avg) ? "var(--zerodha-green)" : "var(--zerodha-red)" }}>
                    {parseFloat(form.price) >= parseFloat(holding.avg) ? "+" : ""}
                    ₹{((parseFloat(form.price) - parseFloat(holding.avg)) * parseInt(form.qty || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              )}
            </div>
            <button style={{ width: "100%", justifyContent: "center", padding: 13 }} className="btn btn-danger" disabled={loading || !stockSelected}>
              {loading ? "Placing order..." : `Sell ${form.name || "stock"}`}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}