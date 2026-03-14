// frontend/src/dashboard/Dashboard.jsx
import { useContext, useState } from "react";
import { NavLink, Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GeneralContext from "../context/GeneralContext";
import WatchList from "./WatchList";
import Summary from "./Summary";
import Holdings from "./Holdings";
import Positions from "./Positions";
import Orders from "./Orders";
import Funds from "./Funds";
import Profile from "./Profile";
import Markets from "./Markets";
import BuyActionWindow from "./BuyActionWindow";
import SellActionWindow from "./SellActionWindow";
import AIChatbot from "./AIChatbot";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { isBuyWindowOpen, closeBuyWindow, isSellWindowOpen, closeSellWindow, selectedStock } = useContext(GeneralContext);
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleBuyClose = (tradeData) => {
    closeBuyWindow(!!tradeData);
  };

  const handleSellClose = (tradeData) => {
    closeSellWindow(!!tradeData);
  };

  const navItems = [
    { to: "/dashboard",           icon: "fa-home",         label: "Summary",  end: true },
    { to: "/dashboard/orders",    icon: "fa-list-alt",     label: "Orders"             },
    { to: "/dashboard/holdings",  icon: "fa-briefcase",    label: "Holdings"           },
    { to: "/dashboard/positions", icon: "fa-exchange-alt", label: "Positions"          },
    { to: "/dashboard/markets",   icon: "fa-chart-line",   label: "Markets"            },
    { to: "/dashboard/funds",     icon: "fa-rupee-sign",   label: "Funds"              },
    { to: "/dashboard/profile",   icon: "fa-user",         label: "Profile"            },
  ];

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="dashboard-container">
      {/* Sidebar overlay (mobile) */}
      <div
        className={`sidebar-overlay${sidebarOpen ? " open" : ""}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`dashboard-sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">Zerodha Kite</div>
          {/* X button — only visible on mobile */}
          <button className="sidebar-close" onClick={closeSidebar} aria-label="Close menu">✕</button>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => isActive ? "active" : ""}
              onClick={closeSidebar}
            >
              <i className={`fa ${item.icon}`} />{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="name">{user?.name}</div>
              <div className="email">{user?.email}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={() => { logout(); navigate("/"); }}>
            <i className="fa fa-sign-out-alt" /> Logout
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", flexDirection: "column" }}>
        {/* Mobile-only topbar with hamburger — hidden on desktop via CSS */}
        <div className="dashboard-topbar">
          <div className="topbar-left">
            <button
              className="topbar-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <i className="fa fa-bars" />
            </button>
            <span className="topbar-title">Zerodha Kite</span>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <WatchList />
          <div className="dashboard-main">
            <div className="dashboard-content">
              <Routes>
                <Route index            element={<Summary />}   />
                <Route path="orders"    element={<Orders />}    />
                <Route path="holdings"  element={<Holdings />}  />
                <Route path="positions" element={<Positions />} />
                <Route path="markets"   element={<Markets />}   />
                <Route path="funds"     element={<Funds />}     />
                <Route path="profile"   element={<Profile />}   />
              </Routes>
            </div>
          </div>
        </div>
      </div>

      {isBuyWindowOpen  && <BuyActionWindow  stockName={selectedStock} onClose={handleBuyClose}  />}
      {isSellWindowOpen && <SellActionWindow stockName={selectedStock} onClose={handleSellClose} />}


      <AIChatbot />
    </div>
  );
}