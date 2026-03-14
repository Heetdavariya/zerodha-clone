// frontend/src/dashboard/BuyActionWindow.jsx
import { useState, useEffect, useContext } from "react";
import api from "../utils/api";
import StockSearch from "../components/StockSearch";
import GeneralContext from "../context/GeneralContext";

export default function BuyActionWindow({ stockName, onClose }) {
  const [form, setForm]             = useState({ name: stockName || "", qty: 1, price: "", orderType: "MARKET", product: "CNC", exchange: "NSE" });
  const [loading, setLoading]       = useState(false);
  const [msg, setMsg]               = useState(null);
  const [funds, setFunds]           = useState(0);
  const [stockSelected, setStockSelected] = useState(!!stockName);
  const { triggerRefresh }          = useContext(GeneralContext);

  useEffect(() => { api.get("/dashboard/funds").then(({ data }) => setFunds(data.funds)); }, []);

  const total = (parseFloat(form.qty) || 0) * (parseFloat(form.price) || 0);

  const handleStockSelect = (stock) => {
    if (stock) {
      setForm((p) => ({ ...p, name: stock.symbol, price: stock.price.toString(), exchange: stock.exchange }));
      setStockSelected(true);
    } else {
      setForm((p) => ({ ...p, name: "", price: "" }));
      setStockSelected(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !stockSelected)   { setMsg({ type: "error", text: "Please select a valid stock from the list." }); return; }
    if (!form.price || form.price <= 0) { setMsg({ type: "error", text: "Enter a valid price." }); return; }
    if (!form.qty   || form.qty   <= 0) { setMsg({ type: "error", text: "Enter a valid quantity." }); return; }
    setLoading(true); setMsg(null);
    try {
      const { data } = await api.post("/dashboard/orders", { ...form, mode: "BUY", qty: parseInt(form.qty), price: parseFloat(form.price) });
      setMsg({ type: "success", text: data.message });
      triggerRefresh();
      onClose(true); // signal success to close window
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Order failed." });
    } finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        .buy-window { width: 460px; }
        @media (max-width: 480px) {
          .buy-window { width: 100% !important; border-radius: 16px 16px 0 0 !important; }
        }
        @media (min-width: 481px) and (max-width: 768px) {
          .buy-window { width: calc(100vw - 32px) !important; max-width: 460px !important; }
        }
      `}</style>

      <div className="action-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="action-window buy buy-window" style={{ borderRadius: "16px 16px 0 0", padding: 28, background: "#fff", boxShadow: "0 -4px 30px rgba(0,0,0,0.15)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ color: "var(--zerodha-blue)", margin: 0 }}>
              Buy {form.name && <span style={{ fontWeight: 400, fontSize: 16 }}>— {form.name}</span>}
            </h3>
            <button onClick={() => onClose()} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--text-muted)" }}>✕</button>
          </div>

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
                <label>Quantity</label>
                <input type="number" className="form-control" min="1" value={form.qty} onChange={(e) => setForm((p) => ({ ...p, qty: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Price (₹)</label>
                <input type="number" className="form-control" min="0.01" step="0.01" placeholder="0.00" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
              </div>
            </div>
            <div className="action-summary">
              <div className="row"><span>Available funds</span><span style={{ color: "var(--zerodha-green)", fontWeight: 600 }}>₹{funds.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
              <div className="row" style={{ marginTop: 8 }}><span>Estimated total</span><strong>₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></div>
            </div>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: 13 }} disabled={loading || !stockSelected}>
              {loading ? "Placing order..." : `Buy ${form.name || "stock"}`}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}