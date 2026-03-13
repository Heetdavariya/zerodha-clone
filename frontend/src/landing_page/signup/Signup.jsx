import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Minimum 6 characters";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setErrors({}); setApiError(""); setLoading(true);
    try {
      const { data } = await api.post("/auth/signup", { name: form.name, email: form.email, phone: form.phone, password: form.password });
      login(data.token, data.user);
      navigate("/dashboard");
    } catch (err) {
      setApiError(err.response?.data?.message || "Signup failed. Please try again.");
    } finally { setLoading(false); }
  };

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>📈</div>
          <h2>Start your investment journey</h2>
          <p>Join 1.5 crore+ Indians who trust Zerodha for their financial goals.</p>
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 14 }}>
            {["₹0 account opening fee", "₹0 brokerage on equity delivery", "Flat ₹20 on intraday & F&O", "Free direct mutual funds"].map((i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15 }}>
                <i className="fa fa-check-circle" style={{ color: "#4ade80" }} />{i}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-box">
          <h1>Create account</h1>
          <p className="auth-sub">Open your free Demat &amp; trading account</p>
          {apiError && <div className="alert alert-error"><i className="fa fa-exclamation-circle" />{apiError}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full name</label>
              <input className={`form-control${errors.name ? " error" : ""}`} placeholder="Enter your full name" value={form.name} onChange={set("name")} />
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>
            <div className="form-group">
              <label>Email address</label>
              <input type="email" className={`form-control${errors.email ? " error" : ""}`} placeholder="you@example.com" value={form.email} onChange={set("email")} />
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>
            <div className="form-group">
              <label>Phone number <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></label>
              <input className="form-control" placeholder="+91 XXXXXXXXXX" value={form.phone} onChange={set("phone")} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" className={`form-control${errors.password ? " error" : ""}`} placeholder="Min. 6 characters" value={form.password} onChange={set("password")} />
              {errors.password && <p className="form-error">{errors.password}</p>}
            </div>
            <div className="form-group">
              <label>Confirm password</label>
              <input type="password" className={`form-control${errors.confirm ? " error" : ""}`} placeholder="Re-enter password" value={form.confirm} onChange={set("confirm")} />
              {errors.confirm && <p className="form-error">{errors.confirm}</p>}
            </div>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "13px" }} disabled={loading}>
              {loading ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Creating account...</> : "Create account"}
            </button>
          </form>
          <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
