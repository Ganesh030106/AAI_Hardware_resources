import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Authentication Pages
import UserLogin from './pages/UserLogin';
import AdminLogin from './pages/AdminLogin';
import SuperAdminLogin from './pages/SuperAdminLogin';
import TechnicianLogin from './pages/TechnicianLogin';

// User Portal Pages
import UserDash from './pages/user/UserDash';
import UserRequest from './pages/user/UserRequest';
import RaiseMain from './pages/user/RaiseMain';
import UserIssue from './pages/user/UserIssue';
import MyRequest from './pages/user/MyRequest';
import ProfileDashboard from './pages/user/ProfileDashboard';
import Settings from './pages/user/Settings';
import TechDash from './pages/user/TechDash';

// Admin Portal Pages
import AdDash from './pages/admin/AdDash';
import AdInventory from './pages/admin/AdInventory';
import AdTicket from './pages/admin/AdTicket';
import AdIssue from './pages/admin/AdIssue';
import AdProfileDashboard from './pages/admin/AdProfileDashboard';
import AdSettings from './pages/admin/AdSettings';
import AdExport from './pages/admin/AdExport';
import AdNRequest from './pages/admin/AdNRequest';
import AdPrediction from './pages/admin/AdPrediction';

// SuperAdmin Portal Pages
import SuperAdminDash from './pages/SuperAdminDash';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <Routes>
              {/* Root route: Redirects to login */}
              <Route path="/" element={<Navigate to="/html/UserLogin.html" replace />} />
              <Route path="/login" element={<Navigate to="/html/UserLogin.html" replace />} />
              <Route path="/admin" element={<Navigate to="/html/AdminLogin.html" replace />} />
              <Route path="/superadmin" element={<Navigate to="/html/SuperAdminLogin.html" replace />} />

              {/* Login Routes */}
              <Route path="/html/UserLogin.html" element={<UserLogin />} />
              <Route path="/html/AdminLogin.html" element={<AdminLogin />} />
              <Route path="/html/SuperAdminLogin.html" element={<SuperAdminLogin />} />
              <Route path="/html/TechnicianLogin.html" element={<TechnicianLogin />} />

              {/* User Dashboards */}
              <Route path="/html/user_dash.html" element={<UserDash />} />
              <Route path="/user/dash" element={<UserDash />} />

              {/* Technician Dashboard */}
              <Route path="/html/TechDash.html" element={<TechDash />} />
              <Route path="/tech/dash" element={<TechDash />} />

              <Route path="/html/user_request.html" element={<UserRequest />} />
              <Route path="/user/request" element={<UserRequest />} />

              <Route path="/html/raise_main.html" element={<RaiseMain />} />
              <Route path="/user/raise" element={<RaiseMain />} />

              <Route path="/html/user_issue.html" element={<UserIssue />} />
              <Route path="/user/issue" element={<UserIssue />} />

              <Route path="/html/MyRequest.html" element={<MyRequest />} />
              <Route path="/user/myrequests" element={<MyRequest />} />

              <Route path="/html/profile_dashboard.html" element={<ProfileDashboard />} />
              <Route path="/user/profile" element={<ProfileDashboard />} />

              <Route path="/html/Settings.html" element={<Settings />} />
              <Route path="/user/settings" element={<Settings />} />

              {/* Admin Dashboards */}
              <Route path="/html/Ad-dash.html" element={<AdDash />} />
              <Route path="/admin/dash" element={<AdDash />} />

              <Route path="/html/Ad-inventory.html" element={<AdInventory />} />
              <Route path="/admin/inventory" element={<AdInventory />} />

              <Route path="/html/Ad-ticket.html" element={<AdTicket />} />
              <Route path="/admin/tickets" element={<AdTicket />} />

              <Route path="/html/Ad-issue.html" element={<AdIssue />} />
              <Route path="/admin/issues" element={<AdIssue />} />

              <Route path="/html/Ad-profile_dashboard.html" element={<AdProfileDashboard />} />
              <Route path="/admin/profile" element={<AdProfileDashboard />} />

              <Route path="/html/Ad-settings.html" element={<AdSettings />} />
              <Route path="/admin/settings" element={<AdSettings />} />

              <Route path="/html/Ad-export.html" element={<AdExport />} />
              <Route path="/admin/export" element={<AdExport />} />

              <Route path="/html/Ad_n_request.html" element={<AdNRequest />} />
              <Route path="/admin/new-request" element={<AdNRequest />} />

              <Route path="/html/Ad-prediction.html" element={<AdPrediction />} />
              <Route path="/admin/prediction" element={<AdPrediction />} />

              {/* SuperAdmin Dashboard */}
              <Route path="/html/SuperAdminDash.html" element={<SuperAdminDash />} />
              <Route path="/superadmin/dash" element={<SuperAdminDash />} />

              {/* Fallback 404 handler redirects to login */}
              <Route path="*" element={<Navigate to="/html/UserLogin.html" replace />} />
            </Routes>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
