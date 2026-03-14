// frontend/src/dashboard/Funds.jsx
import { useEffect, useState } from "react";
import api from "../utils/api";

export default function Funds() {
  const [funds, setFunds] = useState(0);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = () => api.get("/dashboard/funds").then(({ data }) => setFunds(data.funds)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const addFunds = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    setAdding(true); setMsg(null);
    try {
      const { data } = await api.post("/dashboard/funds/add", { amount: amt });
      setFunds(data.funds);
      setAmount("");
      setMsg({ type: "success", text: data.message });
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to add funds." });
    } finally { setAdding(false); }
  };

  const presets = [1000, 5000, 10000, 25000, 50000];

  if (loading) return <div className="page-loader" style={{ minHeight: 300 }}><div className="spinner" /></div>;

  return (
    <div>
      <h2 style={{ fontSize: "clamp(16px, 4vw, 22px)", fontWeight: 700, marginBottom: 20 }}>Funds</h2>

      {/* Use className funds-grid — responsive via CSS */}
      <div className="funds-grid">

        {/* Balance card */}
        <div className="card">
          <div className="card-header"><span className="card-title">Available balance</span></div>
          <div className="card-body" style={{ textAlign: "center", padding: "28px 20px" }}>
            <div style={{ fontSize: "clamp(28px, 8vw, 42px)", fontWeight: 700, color: "var(--zerodha-blue)" }}>
              ₹{funds.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p style={{ color: "var(--text-muted)", marginTop: 8, fontSize: 14 }}>Available for trading</p>
            <div style={{ marginTop: 20, padding: 14, background: "var(--bg-secondary)", borderRadius: "var(--radius-sm)", fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: "var(--text-muted)" }}>Equity</span>
                <span style={{ fontWeight: 600 }}>₹{funds.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Commodity</span>
                <span style={{ fontWeight: 600 }}>₹0.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Add funds card */}
        <div className="card">
          <div className="card-header"><span className="card-title">Add funds</span></div>
          <div className="card-body">
            {msg && (
              <div className={`alert alert-${msg.type}`} style={{ marginBottom: 14 }}>
                <i className={`fa fa-${msg.type === "success" ? "check-circle" : "exclamation-circle"}`} />
                {msg.text}
              </div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {presets.map((p) => (
                <button key={p} className="btn btn-outline btn-sm" onClick={() => setAmount(String(p))}>
                  ₹{p.toLocaleString("en-IN")}
                </button>
              ))}
            </div>
            <form onSubmit={addFunds}>
              <div className="form-group">
                <label>Enter amount (₹)</label>
                <input
                  type="number" className="form-control" placeholder="e.g. 10000"
                  value={amount} onChange={(e) => setAmount(e.target.value)} min="1" step="1"
                />
              </div>
              <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={adding || !amount}>
                {adding ? "Adding..." : "Add funds"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Info note */}
      <div style={{ marginTop: 20, padding: "14px 18px", background: "#fff8e1", border: "1px solid #ffe082", borderRadius: "var(--radius-sm)", fontSize: 13, color: "#795548" }}>
        <i className="fa fa-info-circle" style={{ marginRight: 8 }} />
        This is a paper trading platform. No real money is involved. Funds added here are virtual.
      </div>
    </div>
  );
}