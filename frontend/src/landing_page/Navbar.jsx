import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Lock scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <NavLink to="/" className="navbar-logo-text">Zerodha</NavLink>
        </div>

        {/* Desktop links */}
        <div className="navbar-links">
          <NavLink to="/about">About</NavLink>
          <NavLink to="/products">Products</NavLink>
          <NavLink to="/pricing">Pricing</NavLink>
          <NavLink to="/support">Support</NavLink>
        </div>

        {/* Desktop actions */}
        <div className="navbar-actions">
          {user ? (
            <>
              <button className="btn btn-outline btn-sm" onClick={() => navigate(user.role === "admin" ? "/admin" : "/dashboard")}>
                <i className="fa fa-th-large" /> {user.role === "admin" ? "Admin Panel" : "Dashboard"}
              </button>
              <button className="btn btn-sm" style={{ color: "#e74c3c", background: "#fff5f5", border: "1px solid #fed7d7" }} onClick={handleLogout}>
                <i className="fa fa-sign-out-alt" /> Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn btn-outline btn-sm">Login</NavLink>
              <NavLink to="/signup" className="btn btn-primary btn-sm">Open Account</NavLink>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="navbar-hamburger"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <span style={{ transform: menuOpen ? "rotate(45deg) translate(5px, 5px)" : "" }} />
          <span style={{ opacity: menuOpen ? 0 : 1 }} />
          <span style={{ transform: menuOpen ? "rotate(-45deg) translate(5px, -5px)" : "" }} />
        </button>
      </nav>

      {/* Mobile dropdown menu */}
      <div className={`navbar-mobile-menu${menuOpen ? " open" : ""}`}>
        <NavLink to="/about">About</NavLink>
        <NavLink to="/products">Products</NavLink>
        <NavLink to="/pricing">Pricing</NavLink>
        <NavLink to="/support">Support</NavLink>
        <div style={{ borderTop: "1px solid var(--border)", margin: "8px 0" }} />
        {user ? (
          <>
            <button onClick={() => { navigate(user.role === "admin" ? "/admin" : "/dashboard"); setMenuOpen(false); }}
              style={{ padding: "12px 16px", borderRadius: "var(--radius-sm)", fontSize: 15, fontWeight: 500, color: "var(--zerodha-blue)", width: "100%", textAlign: "left", border: "none", background: "#f0f6ff", cursor: "pointer" }}>
              <i className="fa fa-th-large" style={{ marginRight: 8 }} />
              {user.role === "admin" ? "Admin Panel" : "Dashboard"}
            </button>
            <button onClick={handleLogout}
              style={{ padding: "12px 16px", borderRadius: "var(--radius-sm)", fontSize: 15, fontWeight: 500, color: "#e74c3c", width: "100%", textAlign: "left", border: "none", background: "#fff5f5", cursor: "pointer" }}>
              <i className="fa fa-sign-out-alt" style={{ marginRight: 8 }} /> Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" style={{ padding: "12px 16px", color: "var(--zerodha-blue)", fontWeight: 600, fontSize: 15 }}>Login</NavLink>
            <NavLink to="/signup"
              style={{ padding: "12px 16px", background: "var(--zerodha-blue)", color: "#fff", borderRadius: "var(--radius-sm)", fontWeight: 600, fontSize: 15, textAlign: "center" }}>
              Open Account
            </NavLink>
          </>
        )}
      </div>
    </>
  );
}
