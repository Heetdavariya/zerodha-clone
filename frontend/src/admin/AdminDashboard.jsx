import { useEffect, useState } from "react";
import api from "../utils/api";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/stats").then(({ data }) => setStats(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div>
      <div className="admin-topbar"><h1>Dashboard</h1></div>
      <div className="admin-content"><div className="page-loader" style={{ minHeight: 300 }}><div className="spinner" /></div></div>
    </div>
  );

  const statCards = [
    { label: "Total users", value: stats.totalUsers, icon: "fa-users", cls: "icon-blue" },
    { label: "Active users", value: stats.activeUsers, icon: "fa-user-check", cls: "icon-green" },
    { label: "Total orders", value: stats.totalOrders, icon: "fa-shopping-cart", cls: "icon-purple" },
    { label: "Orders today", value: stats.todayOrders, icon: "fa-calendar-day", cls: "icon-orange" },
    { label: "New users today", value: stats.newUsersToday, icon: "fa-user-plus", cls: "icon-green" },
    { label: "Pending KYC", value: stats.pendingKyc, icon: "fa-id-card", cls: "icon-red" },
  ];

  // Build chart data — fill missing days
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const found = stats.usersByDay.find((x) => x._id === key);
    last7.push({ date: d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }), count: found ? found.count : 0 });
  }

  const chartData = {
    labels: last7.map((d) => d.date),
    datasets: [{
      label: "New users",
      data: last7.map((d) => d.count),
      backgroundColor: "rgba(56,126,209,0.7)",
      borderColor: "#387ed1",
      borderWidth: 1.5,
      borderRadius: 6,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false }, title: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 12 } }, grid: { color: "#f0f0f0" } },
      x: { ticks: { font: { size: 12 } }, grid: { display: false } },
    },
  };

  return (
    <div>
      <div className="admin-topbar">
        <h1>Dashboard</h1>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </span>
      </div>
      <div className="admin-content">
        {/* Stat cards */}
        <div className="admin-stat-grid">
          {statCards.map((s) => (
            <div className="admin-stat" key={s.label}>
              <div className={`admin-stat-icon ${s.cls}`}><i className={`fa ${s.icon}`} /></div>
              <div className="admin-stat-info">
                <div className="value">{s.value.toLocaleString("en-IN")}</div>
                <div className="label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {/* User registrations chart */}
          <div className="card">
            <div className="card-header"><span className="card-title">User registrations — last 7 days</span></div>
            <div className="card-body">
              <Bar data={chartData} options={chartOptions} height={100} />
            </div>
          </div>

          {/* Order breakdown */}
          <div className="card">
            <div className="card-header"><span className="card-title">Order breakdown</span></div>
            <div className="card-body">
              {[
                { label: "Buy orders", value: stats.buyOrders, color: "var(--zerodha-green)", pct: stats.totalOrders ? Math.round((stats.buyOrders / stats.totalOrders) * 100) : 0 },
                { label: "Sell orders", value: stats.sellOrders, color: "var(--zerodha-red)", pct: stats.totalOrders ? Math.round((stats.sellOrders / stats.totalOrders) * 100) : 0 },
                { label: "Active users", value: stats.activeUsers, color: "var(--zerodha-blue)", pct: stats.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0 },
                { label: "Inactive users", value: stats.inactiveUsers, color: "#ccc", pct: stats.totalUsers ? Math.round((stats.inactiveUsers / stats.totalUsers) * 100) : 0 },
              ].map((item) => (
                <div key={item.label} style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: "var(--text-secondary)" }}>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                  <div style={{ height: 6, background: "#f0f0f0", borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${item.pct}%`, background: item.color, borderRadius: 3, transition: "width 0.5s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
