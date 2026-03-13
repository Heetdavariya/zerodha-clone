import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: "/admin", icon: "fa-tachometer-alt", label: "Dashboard", end: true },
    { to: "/admin/users", icon: "fa-users", label: "Users" },
    { to: "/admin/orders", icon: "fa-shopping-cart", label: "All Orders" },
  ];

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo">Zerodha <span>Admin</span></div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Management Console</div>
        </div>
        <nav className="admin-nav">
          <div className="nav-section">Main</div>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => isActive ? "active" : ""}>
              <i className={`fa ${item.icon}`} />{item.label}
            </NavLink>
          ))}
          <div className="nav-section" style={{ marginTop: 8 }}>Account</div>
          <NavLink to="/dashboard">
            <i className="fa fa-arrow-left" />Back to Kite
          </NavLink>
        </nav>
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 34, height: 34, background: "var(--zerodha-blue)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Administrator</div>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate("/"); }}
            style={{ width: "100%", padding: "8px", background: "rgba(231,76,60,0.15)", color: "#fc8181", border: "1px solid rgba(231,76,60,0.3)", borderRadius: "var(--radius-sm)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
          >
            <i className="fa fa-sign-out-alt" /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
