import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <NavLink to="/" className="navbar-logo-text">Zerodha</NavLink>
      </div>
      <div className="navbar-links">
        <NavLink to="/about">About</NavLink>
        <NavLink to="/products">Products</NavLink>
        <NavLink to="/pricing">Pricing</NavLink>
        <NavLink to="/support">Support</NavLink>
      </div>
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
    </nav>
  );
}
