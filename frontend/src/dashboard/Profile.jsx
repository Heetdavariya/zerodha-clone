import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

export default function Profile() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [profileMsg, setProfileMsg] = useState(null);
  const [pwMsg, setPwMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true); setProfileMsg(null);
    try {
      const { data } = await api.put("/auth/profile", form);
      login(localStorage.getItem("token"), data.user);
      setProfileMsg({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setProfileMsg({ type: "error", text: err.response?.data?.message || "Update failed." });
    } finally { setSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwMsg({ type: "error", text: "New passwords do not match." }); return;
    }
    setSavingPw(true); setPwMsg(null);
    try {
      await api.put("/auth/change-password", { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwMsg({ type: "success", text: "Password changed successfully." });
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      setPwMsg({ type: "error", text: err.response?.data?.message || "Failed to change password." });
    } finally { setSavingPw(false); }
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Profile</h2>

      {/* Avatar + Info */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 72, height: 72, background: "var(--zerodha-blue)", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 700 }}>{user?.name}</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>{user?.email}</p>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <span className={`badge badge-${user?.kycStatus}`}>{user?.kycStatus?.toUpperCase()} KYC</span>
              <span className="badge badge-active">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit profile */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><span className="card-title">Edit profile</span></div>
        <div className="card-body">
          {profileMsg && (
            <div className={`alert alert-${profileMsg.type}`} style={{ marginBottom: 16 }}>
              <i className={`fa fa-${profileMsg.type === "success" ? "check-circle" : "exclamation-circle"}`} />
              {profileMsg.text}
            </div>
          )}
          <form onSubmit={saveProfile}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Full name</label>
                <input className="form-control" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Phone number</label>
                <input className="form-control" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 16, marginBottom: 0 }}>
              <label>Email address</label>
              <input className="form-control" value={user?.email} disabled style={{ background: "#f5f5f5", color: "var(--text-muted)" }} />
            </div>
            <button className="btn btn-primary" style={{ marginTop: 20 }} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>
        </div>
      </div>

      {/* Change password */}
      <div className="card">
        <div className="card-header"><span className="card-title">Change password</span></div>
        <div className="card-body">
          {pwMsg && (
            <div className={`alert alert-${pwMsg.type}`} style={{ marginBottom: 16 }}>
              <i className={`fa fa-${pwMsg.type === "success" ? "check-circle" : "exclamation-circle"}`} />
              {pwMsg.text}
            </div>
          )}
          <form onSubmit={changePassword}>
            <div className="form-group">
              <label>Current password</label>
              <input type="password" className="form-control" value={pwForm.currentPassword} onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>New password</label>
                <input type="password" className="form-control" value={pwForm.newPassword} onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Confirm new password</label>
                <input type="password" className="form-control" value={pwForm.confirm} onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))} />
              </div>
            </div>
            <button className="btn btn-primary" style={{ marginTop: 20 }} disabled={savingPw}>
              {savingPw ? "Updating..." : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
