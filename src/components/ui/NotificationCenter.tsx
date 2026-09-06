import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, type AppNotification } from '../../contexts/NotificationContext';
import { FiBell, FiCheck, FiChevronLeft, FiClock, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

const NotificationCenter: React.FC = () => {
  const { notifications, unreadCount, markAllAsRead, refreshNotifications, loading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = (item: AppNotification) => {
    setIsOpen(false);
    navigate(item.link);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const itemDate = new Date(date);
    const diffMs = now.getTime() - itemDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    return itemDate.toLocaleDateString('ar-EG');
  };

  return (
    <div className="notification-center-wrapper" ref={dropdownRef} style={{ position: 'relative', zIndex: 1000 }}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        className="btn btn-ghost btn-icon notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="التنبيهات والإشعارات"
        aria-label="التنبيهات والإشعارات"
        style={{
          position: 'relative',
          width: 40,
          height: 40,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isOpen ? 'var(--color-primary)' : 'var(--color-gray-700)',
          background: isOpen ? 'var(--color-primary-50, #eff6ff)' : 'transparent',
          border: '1px solid var(--color-gray-200, #e2e8f0)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <FiBell size={20} />

        {/* Counter Badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              background: '#EF4444',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 800,
              minWidth: '18px',
              height: '18px',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
              animation: 'pulseBadge 2s infinite',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="notification-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            left: 0,
            width: 340,
            maxWidth: 'calc(100vw - 32px)',
            background: '#ffffff',
            border: '1.5px solid var(--color-primary-200, #bfdbfe)',
            borderRadius: 'var(--radius-xl, 16px)',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.22), 0 5px 15px rgba(0, 0, 0, 0.08)',
            zIndex: 999999,
            overflow: 'hidden',
            animation: 'scaleUp 0.15s ease-out',
            direction: 'rtl',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 16px',
              background: 'linear-gradient(135deg, var(--color-slate-900, #0f172a), var(--color-primary-dark, #1e3a8a))',
              color: '#FFFFFF',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>🔔</span>
              <strong style={{ fontSize: 14 }}>مركز الإشعارات والتنبيهات</strong>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: '#EF4444',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 12,
                  }}
                >
                  {unreadCount} جديد
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => refreshNotifications()}
                className="btn btn-ghost"
                style={{ color: '#93C5FD', padding: '4px 6px', fontSize: 12 }}
                title="تحديث"
              >
                <FiRefreshCw className={loading ? 'spin-icon' : ''} size={14} />
              </button>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="btn btn-ghost"
                  style={{ color: '#6EE7B7', padding: '4px 6px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                  title="تحديد الكل كمقروء"
                >
                  <FiCheck size={14} /> مقروء
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div
            style={{
              maxHeight: 360,
              overflowY: 'auto',
              padding: '8px 0',
            }}
          >
            {notifications.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '36px 16px',
                  color: 'var(--color-gray-500)',
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-gray-800)' }}>
                  لا توجد تنبيهات معلقة
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-gray-400)', marginTop: 4 }}>
                  أنت مطلع على جميع الإعلانات والفواتير والطلبات
                </div>
              </div>
            ) : (
              notifications.map(item => {
                const iconMap: Record<string, string> = {
                  announcement: '📢',
                  invoice: '🧾',
                  suggestion: '💬',
                  payment: '💰',
                };

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--color-gray-100, #f1f5f9)',
                      background: item.isUrgent ? 'rgba(254, 242, 242, 0.7)' : 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = 'var(--color-primary-50, #eff6ff)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = item.isUrgent
                        ? 'rgba(254, 242, 242, 0.7)'
                        : 'transparent';
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: item.isUrgent ? '#FEE2E2' : 'var(--color-primary-100, #dbeafe)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        flexShrink: 0,
                      }}
                    >
                      {iconMap[item.type] || '🔔'}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 6,
                          marginBottom: 3,
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: 13,
                            color: item.isUrgent ? 'var(--color-danger, #ef4444)' : 'var(--color-gray-900, #0f172a)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.title}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: 'var(--color-gray-400)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            flexShrink: 0,
                          }}
                        >
                          <FiClock size={10} /> {formatTimeAgo(item.time)}
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--color-gray-600, #475569)',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {item.message}
                      </div>
                    </div>

                    <FiChevronLeft size={16} style={{ color: 'var(--color-gray-400)', alignSelf: 'center' }} />
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
