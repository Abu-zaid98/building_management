import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import './styles/globals.css';

// Root redirector based on current user session
const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === 'resident') {
      return <Navigate to="/resident/dashboard" replace />;
    }
  }

  return <Navigate to="/login" replace />;
};

// ===== Pages (Lazy Loaded) =====
const Login = lazy(() => import('./pages/Login'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ResidentDashboard = lazy(() => import('./pages/resident/ResidentDashboard'));
const CreateAdmin = lazy(() => import('./pages/admin/CreateAdmin'));
const Units = lazy(() => import('./pages/admin/Units'));
const Residents = lazy(() => import('./pages/admin/Residents'));
const Invoices = lazy(() => import('./pages/admin/Invoices'));
const Payments = lazy(() => import('./pages/admin/Payments'));
const AdminSuggestions = lazy(() => import('./pages/admin/Suggestions'));
const AdminAnnouncements = lazy(() => import('./pages/admin/Announcements'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const AdminBuildingInfo = lazy(() => import('./pages/admin/BuildingInfo'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const BuildingTree = lazy(() => import('./pages/admin/BuildingTree'));
const Treasury = lazy(() => import('./pages/admin/Treasury'));
const ServicesManager = lazy(() => import('./pages/admin/ServicesManager'));

const ResidentUnits = lazy(() => import('./pages/resident/ResidentUnits'));
const ResidentInvoices = lazy(() => import('./pages/resident/ResidentInvoices'));
const ResidentPayments = lazy(() => import('./pages/resident/ResidentPayments'));
const ResidentSuggestion = lazy(() => import('./pages/resident/Suggestion'));
const ResidentAnnouncements = lazy(() => import('./pages/resident/Announcements'));
const ResidentProfile = lazy(() => import('./pages/resident/Profile'));
const ResidentServicesView = lazy(() => import('./pages/resident/ServicesView'));

// Placeholder pages
const PlaceholderPage: React.FC<{ title: string; icon?: string }> = ({ title, icon = '🏗️' }) => (
  <div>
    <div className="page-header">
      <div className="page-header-left">
        <h1 className="page-header-title">{title}</h1>
        <div className="page-header-sub">قيد التطوير - سيتوفر قريباً</div>
      </div>
    </div>
    <div className="card">
      <div className="empty-state">
        <div className="empty-state-icon">{icon}</div>
        <div className="empty-state-title">هذه الصفحة قيد التطوير</div>
        <div className="empty-state-sub">سيتم إضافة هذه الميزة في المراحل القادمة من التطوير</div>
      </div>
    </div>
  </div>
);

// Loading fallback
const PageLoader = () => (
  <div className="loading-screen">
    <div className="loading-spinner" />
    <p style={{ color: 'var(--color-gray-500)', fontSize: 14 }}>جارٍ التحميل...</p>
  </div>
);

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ===== Public Routes ===== */}
            <Route path="/login" element={<Login />} />
            <Route path="/setup" element={<CreateAdmin />} />
            <Route path="/" element={<RootRedirect />} />

            {/* ===== Admin Routes ===== */}
            <Route element={<ProtectedRoute allowedRole="admin" />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/units" element={<Units />} />
                <Route path="/admin/residents" element={<Residents />} />
                <Route path="/admin/treasury" element={<Treasury />} />
                <Route path="/admin/invoices" element={<Invoices />} />
                <Route path="/admin/payments" element={<Navigate to="/admin/invoices" replace />} />
                <Route path="/admin/services" element={<ServicesManager />} />
                <Route path="/admin/suggestions" element={<AdminSuggestions />} />
                <Route path="/admin/announcements" element={<AdminAnnouncements />} />
                <Route path="/admin/reports" element={<Reports />} />
                <Route path="/admin/building-info" element={<AdminBuildingInfo />} />
                <Route path="/admin/settings" element={<Settings />} />
                <Route path="/admin/building-tree" element={<BuildingTree />} />
              </Route>
            </Route>

            {/* ===== Resident Routes ===== */}
            <Route element={<ProtectedRoute allowedRole="resident" />}>
              <Route element={<AdminLayout />}>
                <Route path="/resident/dashboard" element={<ResidentDashboard />} />
                <Route path="/resident/units" element={<ResidentUnits />} />
                <Route path="/resident/invoices" element={<ResidentInvoices />} />
                <Route path="/resident/payments" element={<Navigate to="/resident/invoices" replace />} />
                <Route path="/resident/services" element={<ResidentServicesView />} />
                <Route path="/resident/suggestion" element={<ResidentSuggestion />} />
                <Route path="/resident/announcements" element={<ResidentAnnouncements />} />
                <Route path="/resident/profile" element={<ResidentProfile />} />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </Suspense>

        {/* Toast Notifications */}
        <Toaster
          position="bottom-left"
          toastOptions={{
            style: {
              fontFamily: 'Tajawal, sans-serif',
              fontSize: '14px',
              direction: 'rtl',
              borderRadius: '10px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
            },
            success: {
              iconTheme: { primary: '#059669', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: '#fff' },
            },
            duration: 3500,
          }}
        />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
