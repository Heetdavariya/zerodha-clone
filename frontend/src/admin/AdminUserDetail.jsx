import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editFunds, setEditFunds] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = () => {
    setLoading(true);
    api.get(`/admin/users/${id}`).then(({ data }) => { setData(data); setEditFunds(data.user.funds); }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [id]);

  const updateUser = async (updates) => {
    setSaving(true); setMsg(null);
    try {
      await api.put(`/admin/users/${id}`, updates);
      setMsg({ type: "success", text: "User updated successfully." });
      load();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Update failed." });
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div>
      <div className="admin-topbar"><h1>User detail</h1></div>
      <div className="admin-content"><div className="page-loader" style={{ minHeight: 300 }}><div className="spinner" /></div></div>
    </div>
  );

  const { user, orders, holdings } = data;
  const initials = user.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div>
      <div className="admin-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn btn-outline btn-sm" onClick={() => navigate("/admin/users")}>
            <i className="fa fa-arrow-left" /> Back
          </button>
          <h1>User detail</h1>
        </div>
      </div>
      <div className="admin-content">
        {msg && (
          <div className={`alert alert-${msg.type}`} style={{ marginBottom: 20, maxWidth: 600 }}>
            <i className={`fa fa-${msg.type === "success" ? "check-circle" : "exclamation-circle"}`} />{msg.text}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 24 }}>
          {/* Left: user info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="card">
              <div className="card-body" style={{ textAlign: "center", padding: "28px 24px" }}>
                <div style={{ width: 64, height: 64, background: "var(--zerodha-blue)", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, margin: "0 auto 14px" }}>{initials}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>{user.name}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>{user.email}</p>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
                  <span className={`badge badge-${user.kycStatus}`}>{user.kycStatus.toUpperCase()}</span>
                  <span className={`badge badge-${user.isActive ? "active" : "inactive"}`}>{user.isActive ? "Active" : "Inactive"}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">Account info</span></div>
              <div className="card-body" style={{ fontSize: 14 }}>
                {[
                  ["User ID", user._id.slice(-8).toUpperCase()],
                  ["Phone", user.phone || "—"],
                  ["Registered", new Date(user.createdAt).toLocaleDateString("en-IN")],
                  ["Last login", user.lastLogin ? new Date(user.lastLogin).toLocaleDateString("en-IN") : "Never"],
                  ["Holdings", `${holdings.length} stocks`],
                  ["Orders", `${orders.length} orders`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--text-muted)" }}>{k}</span>
                    <span style={{ fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">Manage</span></div>
              <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Toggle active */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14 }}>Account active</span>
                  <label className="toggle">
                    <input type="checkbox" checked={user.isActive} onChange={() => updateUser({ isActive: !user.isActive })} />
                    <span className="toggle-slider" />
                  </label>
                </div>
                {/* KYC */}
                <div>
                  <label style={{ fontSize: 13, display: "block", marginBottom: 6, color: "var(--text-secondary)" }}>KYC status</label>
                  <select className="filter-select" style={{ width: "100%" }} value={user.kycStatus} onChange={(e) => updateUser({ kycStatus: e.target.value })}>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                {/* Funds */}
                <div>
                  <label style={{ fontSize: 13, display: "block", marginBottom: 6, color: "var(--text-secondary)" }}>Set funds (₹)</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input type="number" className="form-control" value={editFunds} onChange={(e) => setEditFunds(e.target.value)} />
                    <button className="btn btn-primary btn-sm" disabled={saving} onClick={() => updateUser({ funds: parseFloat(editFunds) })}>Set</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: orders + holdings */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="card">
              <div className="card-header"><span className="card-title">Holdings ({holdings.length})</span></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Stock</th><th>Qty</th><th>Avg</th><th>LTP</th><th>P&L</th></tr></thead>
                  <tbody>
                    {holdings.length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>No holdings</td></tr>
                    ) : holdings.map((h) => {
                      const pnl = (h.price - h.avg) * h.qty;
                      return (
                        <tr key={h._id}>
                          <td style={{ fontWeight: 600 }}>{h.name}</td>
                          <td>{h.qty}</td>
                          <td>₹{h.avg}</td>
                          <td>₹{h.price}</td>
                          <td className={pnl >= 0 ? "gain" : "loss"}>{pnl >= 0 ? "+" : ""}₹{pnl.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">Order history ({orders.length})</span></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Date</th><th>Stock</th><th>Mode</th><th>Qty</th><th>Price</th><th>Value</th><th>Status</th></tr></thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr><td colSpan="7" style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>No orders</td></tr>
                    ) : orders.slice(0, 20).map((o) => (
                      <tr key={o._id}>
                        <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                        <td style={{ fontWeight: 600 }}>{o.name}</td>
                        <td><span className={`badge badge-${o.mode.toLowerCase()}`}>{o.mode}</span></td>
                        <td>{o.qty}</td>
                        <td>₹{o.price}</td>
                        <td>₹{(o.qty * o.price).toFixed(2)}</td>
                        <td><span className={`badge badge-${o.status.toLowerCase()}`}>{o.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
