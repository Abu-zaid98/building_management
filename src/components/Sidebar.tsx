import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBuildingInfo } from '../services/buildingInfo';
import { useNotifications } from '../contexts/NotificationContext';
import ConfirmDialog from './ui/ConfirmDialog';
import {
  FiHome, FiUsers, FiFileText, FiDollarSign,
  FiMessageSquare, FiBell, FiBarChart2, FiSettings,
  FiLogOut, FiInfo, FiPieChart, FiX, FiCode, FiGrid, FiTool
} from 'react-icons/fi';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface SingleNavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  badgeColor?: string;
}

interface SectionNavItem {
  section: string;
  items: SingleNavItem[];
}

type AdminNavItem = SingleNavItem | SectionNavItem;

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { buildingInfo } = useBuildingInfo();
  const { newSuggestionsCount, pendingInvoicesCount, newAnnouncementsCount } = useNotifications();
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const buildingName = buildingInfo?.buildingName || 'نظام إدارة العمارة';

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleConfirmLogout = async () => {
    try {
      setLogoutLoading(true);
      onClose?.();
      await logout();
      navigate('/login');
    } finally {
      setLogoutLoading(false);
      setIsLogoutModalOpen(false);
    }
  };

  const adminNavItems: AdminNavItem[] = [
    { to: '/admin/dashboard', icon: <FiHome />, label: 'لوحة التحكم' },
    {
      section: 'إدارة البيانات',
      items: [
        { to: '/admin/units', icon: <FiHome />, label: 'الشقق والحواصل' },
        { to: '/admin/building-tree', icon: <FiGrid />, label: 'شجرة العمارة' },
        { to: '/admin/residents', icon: <FiUsers />, label: 'السكان' },
      ]
    },
    {
      section: 'الشؤون المالية والخزينة',
      items: [
        {
          to: '/admin/treasury',
          icon: <FiDollarSign />,
          label: 'صندوق وخزينة العمارة',
        },
        {
          to: '/admin/invoices',
          icon: <FiFileText />,
          label: 'رسوم وفواتير الشقق',
          badge: pendingInvoicesCount > 0 ? pendingInvoicesCount : undefined,
          badgeColor: '#F59E0B',
        },
      ]
    },
    {
      section: 'الخدمات والتواصل',
      items: [
        { to: '/admin/services', icon: <FiTool />, label: 'دليل وخطة الخدمات' },
        {
          to: '/admin/suggestions',
          icon: <FiMessageSquare />,
          label: 'الاقتراحات والشكاوى',
          badge: newSuggestionsCount > 0 ? newSuggestionsCount : undefined,
          badgeColor: '#EF4444',
        },
        { to: '/admin/announcements', icon: <FiBell />, label: 'الإعلانات والقرارات' },
      ]
    },
    {
      section: 'الإدارة',
      items: [
        { to: '/admin/reports', icon: <FiBarChart2 />, label: 'التقارير' },
        { to: '/admin/building-info', icon: <FiInfo />, label: 'بيانات العمارة' },
        { to: '/admin/settings', icon: <FiSettings />, label: 'الإعدادات' },
      ]
    },
  ];

  const residentNavItems: SingleNavItem[] = [
    { to: '/resident/dashboard', icon: <FiHome />, label: 'الرئيسية' },
    { to: '/resident/units', icon: <FiHome />, label: 'شققي ووحداتي' },
    {
      to: '/resident/invoices',
      icon: <FiFileText />,
      label: 'الخدمات والفواتير',
      badge: pendingInvoicesCount > 0 ? pendingInvoicesCount : undefined,
      badgeColor: '#EF4444',
    },
    { to: '/resident/services', icon: <FiTool />, label: 'ما نقدمه لكم من خدمات' },
    { to: '/resident/suggestion', icon: <FiMessageSquare />, label: 'اقتراح / شكوى' },
    {
      to: '/resident/announcements',
      icon: <FiBell />,
      label: 'الإعلانات',
      badge: newAnnouncementsCount > 0 ? newAnnouncementsCount : undefined,
      badgeColor: '#3B82F6',
    },
    { to: '/resident/profile', icon: <FiPieChart />, label: 'ملفي الشخصي' },
  ];

  const initials = user?.displayName
    ? user.displayName.split(' ').slice(0, 2).map(n => n[0]).join('')
    : '؟';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 199,
          }}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`} id="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🏢</div>
          <div className="sidebar-logo-text">
            <div className="sidebar-logo-title" title={buildingName}>{buildingName}</div>
            <div className="sidebar-logo-sub">
              {user?.role === 'admin' ? '🛡️ مجلس الإدارة' : '🏠 بوابة الساكن'}
            </div>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon sidebar-close-mobile"
            aria-label="إغلاق القائمة"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {user?.role === 'admin' ? (
            <>
              {adminNavItems.map((item, idx) => {
                if ('section' in item) {
                  return (
                    <div key={idx}>
                      <div className="sidebar-section-title">{item.section}</div>
                      {item.items.map(subItem => (
                        <NavLink
                          key={subItem.to}
                          to={subItem.to}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `sidebar-item ${isActive ? 'active' : ''}`
                          }
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span className="sidebar-item-icon">{subItem.icon}</span>
                            <span>{subItem.label}</span>
                          </div>
                          {subItem.badge !== undefined && subItem.badge > 0 && (
                            <span
                              style={{
                                background: subItem.badgeColor || '#EF4444',
                                color: '#FFFFFF',
                                fontSize: 11,
                                fontWeight: 800,
                                padding: '1px 6px',
                                borderRadius: 10,
                                minWidth: 18,
                                textAlign: 'center',
                                lineHeight: '16px',
                              }}
                            >
                              {subItem.badge}
                            </span>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  );
                }
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `sidebar-item ${isActive ? 'active' : ''}`
                    }
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="sidebar-item-icon">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        style={{
                          background: item.badgeColor || '#EF4444',
                          color: '#FFFFFF',
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: 10,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </>
          ) : (
            residentNavItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? 'active' : ''}`
                }
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="sidebar-item-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    style={{
                      background: item.badgeColor || '#EF4444',
                      color: '#FFFFFF',
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: 10,
                      minWidth: 18,
                      textAlign: 'center',
                      lineHeight: '16px',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))
          )}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.displayName || 'المستخدم'}</div>
              <div className="sidebar-user-role">
                {user?.role === 'admin' ? '🛡️ مجلس الإدارة' : '🏠 ساكن'}
              </div>
            </div>
            <button
              id="btn-logout"
              onClick={() => setIsLogoutModalOpen(true)}
              className="btn btn-ghost btn-icon"
              title="تسجيل الخروج"
              aria-label="تسجيل الخروج"
            >
              <FiLogOut />
            </button>
          </div>

          {/* Developer Credit / Documentation Badge */}
          <div style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1px solid var(--color-gray-200)',
            textAlign: 'center',
            fontSize: '11px',
            color: 'var(--color-gray-500)',
            lineHeight: 1.5,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--color-primary)', fontWeight: 700 }}>
              <FiCode size={12} /> توثيق وتطوير النظام
            </div>
            <div style={{ fontWeight: 800, color: 'var(--color-gray-400)', fontSize: 12, marginTop: 2 }}>
              المهندس / mohammed Suhile EJoujo
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-gray-400)', direction: 'rtl' }}>
              م. محمد سهيل الجوجو
            </div>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        title="تأكيد تسجيل الخروج"
        message="هل أنت متأكد من رغبتك في تسجيل الخروج من حسابك؟"
        confirmText="تسجيل الخروج"
        cancelText="البقاء في النظام"
        type="warning"
        loading={logoutLoading}
      />
    </>
  );
};

export default Sidebar;
