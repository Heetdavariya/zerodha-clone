// frontend/src/dashboard/Orders.jsx
import { useEffect, useState, useContext } from "react";
import api from "../utils/api";
import GeneralContext from "../context/GeneralContext";

export default function Orders() {
  const { refreshCount, openBuyWindow } = useContext(GeneralContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  const load = () => {
    api.get("/dashboard/orders")
      .then(({ data }) => setOrders(data))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [refreshCount]);

  const cancel = async (id) => {
    if (!window.confirm("Cancel this order?")) return;
    await api.delete(`/dashboard/orders/${id}`);
    load();
  };

  const filtered = filter === "ALL" ? orders : orders.filter((o) => o.mode === filter);

  // Check if any order in the filtered list has status OPEN (needs Action column)
  const hasActionableOrders = filtered.some((o) => o.status === "OPEN");

  if (loading) return <div className="page-loader" style={{ minHeight: 300 }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="orders-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ fontSize: "clamp(16px, 4vw, 22px)", fontWeight: 700 }}>Orders ({orders.length})</h2>
        <div className="orders-filters" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["ALL", "BUY", "SELL"].map((f) => (
            <button key={f} className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-outline"}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
          <button className="btn btn-sm btn-primary" onClick={() => openBuyWindow("")}>+ New order</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <i className="fa fa-list-alt" />
          <p>No orders found.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table style={{ minWidth: hasActionableOrders ? 640 : 580 }}>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Stock</th>
                  <th>Type</th>
                  <th>Mode</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Value</th>
                  <th>Status</th>
                  {/* Only show Action column if there are cancellable orders */}
                  {hasActionableOrders && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o._id}>
                    <td style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {new Date(o.createdAt).toLocaleDateString("en-IN")}<br />
                      {new Date(o.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{o.name}</td>
                    <td><span className="tag">{o.orderType}</span></td>
                    <td><span className={`badge badge-${o.mode.toLowerCase()}`}>{o.mode}</span></td>
                    <td>{o.qty}</td>
                    <td style={{ whiteSpace: "nowrap" }}>₹{o.price.toFixed(2)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>₹{(o.qty * o.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td><span className={`badge badge-${o.status.toLowerCase()}`}>{o.status}</span></td>
                    {hasActionableOrders && (
                      <td>
                        {o.status === "OPEN" && (
                          <button className="btn btn-sm btn-danger" onClick={() => cancel(o._id)}>Cancel</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}