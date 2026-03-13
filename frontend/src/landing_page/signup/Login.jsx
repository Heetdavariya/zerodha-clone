import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(""); setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      login(data.token, data.user);
      navigate(data.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setApiError(err.response?.data?.message || "Login failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🔐</div>
          <h2>Welcome back</h2>
          <p>Sign in to your account to access your portfolio, orders, and watchlist.</p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-box">
          <h1>Sign in</h1>
          <p className="auth-sub">Enter your credentials to continue</p>
          {apiError && <div className="alert alert-error"><i className="fa fa-exclamation-circle" />{apiError}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email address</label>
              <input type="email" className="form-control" placeholder="you@example.com" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" className="form-control" placeholder="Your password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required />
            </div>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "13px" }} disabled={loading}>
              {loading ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in...</> : "Sign in"}
            </button>
          </form>
          <p className="auth-footer">Don't have an account? <Link to="/signup">Open free account</Link></p>
        </div>
      </div>
    </div>
  );
}
