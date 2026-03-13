import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { GeneralProvider } from "./context/GeneralContext";

import Navbar from "./landing_page/Navbar";
import Footer from "./landing_page/Footer";
import HomePage from "./landing_page/home/HomePage";
import { AboutPage, ProductPage, PricingPage, SupportPage, NotFound } from "./landing_page/pages";
import Signup from "./landing_page/signup/Signup";
import Login from "./landing_page/signup/Login";

import Dashboard from "./dashboard/Dashboard";

import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/AdminDashboard";
import AdminUsers from "./admin/AdminUsers";
import AdminUserDetail from "./admin/AdminUserDetail";
import AdminOrders from "./admin/AdminOrders";

import "./index.css";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
  return children;
};

const LandingLayout = ({ children }) => (
  <><Navbar />{children}<Footer /></>
);

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LandingLayout><HomePage /></LandingLayout>} />
      <Route path="/about" element={<LandingLayout><AboutPage /></LandingLayout>} />
      <Route path="/products" element={<LandingLayout><ProductPage /></LandingLayout>} />
      <Route path="/pricing" element={<LandingLayout><PricingPage /></LandingLayout>} />
      <Route path="/support" element={<LandingLayout><SupportPage /></LandingLayout>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/dashboard/*" element={
        <ProtectedRoute>
          <GeneralProvider><Dashboard /></GeneralProvider>
        </ProtectedRoute>
      } />
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="users/:id" element={<AdminUserDetail />} />
        <Route path="orders" element={<AdminOrders />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider><App /></AuthProvider>
  </StrictMode>
);
