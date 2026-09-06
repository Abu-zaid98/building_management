import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationCenter from './ui/NotificationCenter';
import { FiMenu } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useBuildingInfo } from '../services/buildingInfo';

const AdminLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { buildingInfo } = useBuildingInfo();

  const buildingName = buildingInfo?.buildingName || 'نظام إدارة العمارة';

  return (
    <div className="app-layout">
      {/* Mobile Top Navbar Header */}
      <header className="mobile-navbar no-print" style={{ zIndex: 90, overflow: 'visible' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="btn btn-ghost btn-icon"
            style={{ fontSize: 22, color: 'var(--color-gray-800)' }}
            aria-label="فتح القائمة الجانبية"
          >
            <FiMenu size={24} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--color-primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 16,
              flexShrink: 0
            }}>
              🏢
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--color-gray-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                {buildingName}
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-gray-500)', fontWeight: 600 }}>
                {user?.role === 'admin' ? '🛡️ مجلس الإدارة' : '🏠 لوحة الساكن'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 105 }}>
          <NotificationCenter />
          <span className={`badge ${user?.role === 'admin' ? 'badge-green' : 'badge-blue'}`} style={{ fontSize: 11 }}>
            {user?.displayName?.split(' ')[0] || (user?.role === 'admin' ? 'أدمن' : 'ساكن')}
          </span>
        </div>
      </header>

      {/* Sidebar Drawer */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <main className="main-content">
        {/* Desktop Top Header Bar with Notification Center */}
        <header className="desktop-top-header hide-on-mobile no-print" style={{
          position: 'relative',
          zIndex: 100,
          overflow: 'visible',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 28px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--color-gray-200)',
          marginBottom: 16,
          borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--color-gray-500)', fontWeight: 600 }}>
              🏢 {buildingName}
            </span>
            <span style={{ color: 'var(--color-gray-300)' }}>|</span>
            <span style={{ fontSize: 12, color: 'var(--color-gray-400)' }}>
              {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Real-time interactive Notification Bell */}
            <NotificationCenter />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 8, borderLeft: '1px solid var(--color-gray-200)' }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: user?.role === 'admin' ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' : '#10B981',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 13
              }}>
                {(user?.displayName || 'م')[0]}
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--color-gray-900)' }}>
                  {user?.displayName || 'المستخدم'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-gray-400)' }}>
                  {user?.role === 'admin' ? '🛡️ مسؤول النظام' : '🏠 ساكن'}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
