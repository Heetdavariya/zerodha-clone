import { useEffect, useState, useCallback } from "react";
import api from "../utils/api";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.set("search", search);
      if (modeFilter) params.set("mode", modeFilter);
      if (statusFilter) params.set("status", statusFilter);
      const { data } = await api.get(`/admin/orders?${params}`);
      setOrders(data.orders); setTotal(data.total); setPages(data.pages);
    } catch {}
    setLoading(false);
  }, [page, search, modeFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div>
      <div className="admin-topbar">
        <h1>All Orders</h1>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{total} total orders</span>
      </div>
      <div className="admin-content">
        <div className="filters-row">
          <div className="search-input-wrap">
            <i className="fa fa-search" />
            <input className="search-input" placeholder="Search by stock symbol…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="filter-select" value={modeFilter} onChange={(e) => { setModeFilter(e.target.value); setPage(1); }}>
            <option value="">All modes</option>
            <option value="BUY">Buy</option>
            <option value="SELL">Sell</option>
          </select>
          <select className="filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All status</option>
            <option value="EXECUTED">Executed</option>
            <option value="OPEN">Open</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>User</th>
                  <th>Stock</th>
                  <th>Mode</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="9" style={{ textAlign: "center", padding: 40 }}><div className="spinner" style={{ margin: "0 auto" }} /></td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan="9" style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>No orders found</td></tr>
                ) : orders.map((o) => (
                  <tr key={o._id}>
                    <td style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {new Date(o.createdAt).toLocaleDateString("en-IN")}<br />
                      {new Date(o.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{o.user?.name || "—"}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{o.user?.email || ""}</div>
                    </td>
                    <td style={{ fontWeight: 700 }}>{o.name}</td>
                    <td><span className={`badge badge-${o.mode.toLowerCase()}`}>{o.mode}</span></td>
                    <td><span className="tag">{o.orderType}</span></td>
                    <td>{o.qty}</td>
                    <td>₹{o.price.toFixed(2)}</td>
                    <td style={{ fontWeight: 600 }}>₹{(o.qty * o.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td><span className={`badge badge-${o.status.toLowerCase()}`}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <span>Showing {orders.length} of {total} orders</span>
            <div className="page-btns">
              <button className="page-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                <i className="fa fa-chevron-left" />
              </button>
              {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map((n) => (
                <button key={n} className={`page-btn${page === n ? " active" : ""}`} onClick={() => setPage(n)}>{n}</button>
              ))}
              <button className="page-btn" disabled={page === pages} onClick={() => setPage((p) => p + 1)}>
                <i className="fa fa-chevron-right" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
