import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [kycFilter, setKycFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (kycFilter) params.set("kyc", kycFilter);
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.users); setTotal(data.total); setPages(data.pages);
    } catch {}
    setLoading(false);
  }, [page, search, statusFilter, kycFilter]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const toggleActive = async (id, current) => {
    setActionLoading(id);
    try {
      await api.put(`/admin/users/${id}`, { isActive: !current });
      load();
    } finally { setActionLoading(null); }
  };

  const updateKyc = async (id, kycStatus) => {
    setActionLoading(id + kycStatus);
    try {
      await api.put(`/admin/users/${id}`, { kycStatus });
      load();
    } finally { setActionLoading(null); }
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}" and all their data? This cannot be undone.`)) return;
    setActionLoading("del" + id);
    try { await api.delete(`/admin/users/${id}`); load(); }
    finally { setActionLoading(null); }
  };

  return (
    <div>
      <div className="admin-topbar">
        <h1>Users</h1>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{total} total users</span>
      </div>
      <div className="admin-content">
        {/* Filters */}
        <div className="filters-row">
          <div className="search-input-wrap">
            <i className="fa fa-search" />
            <input className="search-input" placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select className="filter-select" value={kycFilter} onChange={(e) => { setKycFilter(e.target.value); setPage(1); }}>
            <option value="">All KYC</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Funds</th>
                  <th>KYC</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}><div className="spinner" style={{ margin: "0 auto" }} /></td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>No users found</td></tr>
                ) : users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{u.name}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{u.email}</td>
                    <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{u.phone || "—"}</td>
                    <td style={{ fontWeight: 600, color: "var(--zerodha-blue)" }}>
                      ₹{(u.funds || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                    </td>
                    <td>
                      <select
                        className="filter-select"
                        style={{ padding: "4px 8px", fontSize: 12 }}
                        value={u.kycStatus}
                        onChange={(e) => updateKyc(u._id, e.target.value)}
                        disabled={!!actionLoading}
                      >
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td>
                      <label className="toggle" title={u.isActive ? "Click to deactivate" : "Click to activate"}>
                        <input type="checkbox" checked={u.isActive} onChange={() => toggleActive(u._id, u.isActive)} disabled={actionLoading === u._id} />
                        <span className="toggle-slider" />
                      </label>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {new Date(u.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-sm btn-outline" onClick={() => navigate(`/admin/users/${u._id}`)}>
                          <i className="fa fa-eye" />
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => deleteUser(u._id, u.name)}
                          disabled={actionLoading === "del" + u._id}
                        >
                          <i className="fa fa-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="pagination">
            <span>Showing {users.length} of {total} users</span>
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
