import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { getUnits } from '../../services/units';
import { getResidents } from '../../services/residents';
import { getInvoices } from '../../services/invoices';
import type { Unit, Resident, Invoice } from '../../types';
import {
  FiHome, FiUsers, FiFileText, FiAlertCircle,
  FiMessageSquare, FiBell, FiShoppingBag, FiArchive,
  FiTrendingUp, FiCheckCircle, FiCompass, FiLayers
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { newSuggestionsCount } = useNotifications();
  const [units, setUnits] = useState<Unit[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getUnits(), getResidents(), getInvoices()])
      .then(([unitsData, residentsData, invoicesData]) => {
        setUnits(unitsData);
        setResidents(residentsData);
        setInvoices(invoicesData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Classification Helpers
  const getCategory = (u: Unit) => u.unitCategory || (u.floor === 0 ? 'حاصل' : 'شقة');

  const apartments = units.filter(u => getCategory(u) === 'شقة');
  const stores = units.filter(u => getCategory(u) === 'حاصل');
  const warehouses = units.filter(u => getCategory(u) === 'مخزن' || getCategory(u) === 'موقف');

  const totalUnits = units.length;
  const occupiedUnits = units.filter(u => u.status === 'مأهولة').length;
  const vacantUnits = totalUnits - occupiedUnits;

  const occupiedApartments = apartments.filter(u => u.status === 'مأهولة').length;
  const occupiedStores = stores.filter(u => u.status === 'مأهولة').length;

  const totalResidents = residents.length;

  const pendingInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'overdue');
  const pendingCount = pendingInvoices.length;
  const arrearsAmount = pendingInvoices.reduce((acc, i) => acc + i.amount, 0);

  // Financial breakdown by category
  const apartmentFeesTotal = apartments.reduce((acc, u) => acc + (Number(u.servicesFee) || 0), 0);
  const storeFeesTotal = stores.reduce((acc, u) => acc + (Number(u.servicesFee) || 0), 0);

  const stats = [
    {
      icon: <FiHome />,
      label: 'إجمالي الوحدات',
      value: loading ? '...' : totalUnits,
      color: 'blue',
      sub: `${occupiedUnits} مأهولة / ${vacantUnits} شاغرة`
    },
    {
      icon: <FiUsers />,
      label: 'إجمالي السكان',
      value: loading ? '...' : totalResidents,
      color: 'green',
      sub: 'ساكن مسجل بالنظام'
    },
    {
      icon: <FiFileText />,
      label: 'فواتير معلقة',
      value: loading ? '...' : pendingCount,
      color: 'orange',
      sub: 'بانتظار التحصيل'
    },
    {
      icon: <FiAlertCircle />,
      label: 'إجمالي المتأخرات',
      value: loading ? '...' : `${arrearsAmount} ₪`,
      color: 'red',
      sub: 'مستحقات غير مسددة'
    },
  ];

  const quickActions = [
    { icon: <FiHome />, label: 'الشقق والحواصل', to: '/admin/units', color: 'green' },
    { icon: <FiUsers />, label: 'إدارة السكان', to: '/admin/residents', color: 'blue' },
    { icon: <FiFileText />, label: 'الخدمات والفواتير', to: '/admin/invoices', color: 'orange' },
    { icon: <FiMessageSquare />, label: 'الاقتراحات والشكاوى', to: '/admin/suggestions', color: 'blue' },
    { icon: <FiBell />, label: 'نشر إعلان', to: '/admin/announcements', color: 'orange' },
  ];

  return (
    <div>
      {/* Welcome Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-gray-900)', marginBottom: 6 }}>
          مرحباً، {user?.displayName?.split(' ')[0] || 'أدمن'} 👋
        </h1>
        <p style={{ color: 'var(--color-gray-500)', fontSize: 14 }}>
          لوحة التحكم الرئيسية لنظام إدارة العمارة والمتابعة اللحظية للوحدات والخدمات
        </p>
      </div>

      {/* Active Action Alerts Banner */}
      {newSuggestionsCount > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
            border: '1.5px solid #FCA5A5',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 18px',
            marginBottom: 24,
            boxShadow: '0 2px 10px rgba(239, 68, 68, 0.08)',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#EF4444',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                flexShrink: 0,
              }}
            >
              💬
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#991B1B' }}>
                لديك ({newSuggestionsCount}) اقتراح / شكوى جديدة بانتظار المراجعة والرد!
              </div>
              <div style={{ fontSize: 12, color: '#B91C1C', marginTop: 2 }}>
                يرجى الاطلاع على رسائل السكان والرد على استفساراتهم
              </div>
            </div>
          </div>
          <Link
            to="/admin/suggestions"
            className="btn btn-primary btn-sm"
            style={{ background: '#DC2626', borderColor: '#B91C1C' }}
          >
            الانتقال للصندوق والرد ←
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {stats.map((stat, idx) => (
          <div key={idx} className="stat-card">
            <div className={`stat-card-icon ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <div className="stat-card-value">{stat.value}</div>
              <div className="stat-card-label">{stat.label}</div>
              <div style={{ fontSize: 11, color: 'var(--color-gray-400)', marginTop: 2 }}>{stat.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Unit Categories Breakdown Showcase */}
      <div className="card" style={{ marginBottom: 24, border: '1.5px solid var(--color-primary-200)', background: '#F8FAFC' }}>
        <div className="card-header" style={{ background: '#ffffff' }}>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🏢 تصنيف وتوزيع الوحدات (شقق سكنية / حواصل تجارية / مخازن)</span>
          </div>
          <Link to="/admin/units" className="btn btn-secondary btn-sm" style={{ fontSize: 12 }}>
            إدارة جميع الوحدات ←
          </Link>
        </div>
        <div className="card-body">
          <div className="grid-3" style={{ gap: 16 }}>
            {/* Apartments Card */}
            <div style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 18px',
              border: '1.5px solid #bbf7d0',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    🏠
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: '#166534', margin: 0 }}>الشقق السكنية</h3>
                    <span style={{ fontSize: 12, color: 'var(--color-gray-500)' }}>الوحدات العلوية</span>
                  </div>
                </div>
                <span className="badge badge-green" style={{ fontSize: 13, fontWeight: 800, padding: '4px 10px' }}>
                  {loading ? '...' : apartments.length} شقة
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--color-gray-700)', borderTop: '1px solid #f0fdf4', paddingTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>حالة الإشغال:</span>
                  <strong>{occupiedApartments} مأهولة / {apartments.length - occupiedApartments} شاغرة</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>رسوم الخدمات المقدرة:</span>
                  <strong style={{ color: '#15803d' }}>{apartmentFeesTotal} ₪ / شهر</strong>
                </div>
              </div>
            </div>

            {/* Commercial Stores (الحواصل) Card */}
            <div style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 18px',
              border: '1.5px solid #bfdbfe',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.08)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    🏪
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1e40af', margin: 0 }}>الحواصل التجارية</h3>
                    <span style={{ fontSize: 12, color: 'var(--color-gray-500)' }}>المحلات بالأرضي</span>
                  </div>
                </div>
                <span className="badge badge-blue" style={{ fontSize: 13, fontWeight: 800, padding: '4px 10px' }}>
                  {loading ? '...' : stores.length} حاصل
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--color-gray-700)', borderTop: '1px solid #eff6ff', paddingTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>حالة الإشغال:</span>
                  <strong>{occupiedStores} مأهولة / {stores.length - occupiedStores} شاغرة</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>رسوم الخدمات المقدرة:</span>
                  <strong style={{ color: '#1d4ed8' }}>{storeFeesTotal} ₪ / شهر</strong>
                </div>
              </div>
            </div>

            {/* Other / Warehouses Card */}
            <div style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 18px',
              border: '1.5px solid var(--color-gray-200)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    📦
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-gray-800)', margin: 0 }}>مخازن ومرافق أخرى</h3>
                    <span style={{ fontSize: 12, color: 'var(--color-gray-500)' }}>مواقف ومخازن</span>
                  </div>
                </div>
                <span className="badge badge-gray" style={{ fontSize: 13, fontWeight: 800, padding: '4px 10px' }}>
                  {loading ? '...' : warehouses.length} مرفق
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--color-gray-700)', borderTop: '1px solid var(--color-gray-100)', paddingTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>الحالة العامة:</span>
                  <strong>{warehouses.filter(w => w.status === 'مأهولة').length} مستخدمة / {warehouses.filter(w => w.status !== 'مأهولة').length} شاغرة</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>إجمالي الوحدات المسجلة:</span>
                  <strong style={{ color: 'var(--color-gray-900)' }}>{totalUnits} وحدة</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <div className="card-title">⚡ إجراءات سريعة</div>
            <div className="card-subtitle">الوصول السريع للمهام والعمليات الشائعة</div>
          </div>
        </div>
        <div className="card-body">
          <div className="grid-3" style={{ gap: 12 }}>
            {quickActions.map((action, idx) => (
              <Link
                key={idx}
                to={action.to}
                className="btn btn-secondary"
                style={{
                  justifyContent: 'flex-start',
                  padding: '14px 16px',
                  border: '1.5px solid var(--color-gray-200)',
                  borderRadius: 'var(--radius-md)',
                  gap: 12,
                  textDecoration: 'none',
                  color: 'var(--color-gray-700)',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                <span style={{ fontSize: 18 }}>{action.icon}</span>
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Overview Cards with Distinct Unit Types */}
      <div className="grid-2">
        {/* Latest Units */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🏢 أحدث الوحدات المضافة</div>
            <Link to="/admin/units" className="btn btn-ghost btn-sm">عرض الكل ({units.length})</Link>
          </div>
          <div className="card-body">
            {units.length === 0 ? (
              <div style={{ color: 'var(--color-gray-400)', fontSize: 13, textAlign: 'center', padding: 20 }}>
                لا توجد وحدات مضافة بعد
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {units.slice(0, 5).map(u => {
                  const cat = getCategory(u);
                  const isStore = cat === 'حاصل' || cat === 'مخزن';
                  const floorLabel = u.floor === 0 ? 'الطابق الأرضي' : `الطابق ${u.floor}`;

                  return (
                    <div
                      key={u.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        background: 'var(--color-gray-50)',
                        borderRadius: 8,
                        border: '1px solid var(--color-gray-200)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className={`badge ${cat === 'حاصل' ? 'badge-blue' : cat === 'مخزن' ? 'badge-gray' : 'badge-green'}`} style={{ padding: '4px 8px', fontSize: 11 }}>
                          {cat === 'حاصل' ? '🏪 حاصل' : cat === 'مخزن' ? '📦 مخزن' : '🏠 شقة'}
                        </span>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--color-gray-900)' }}>
                            رقم {u.unitNumber} ({floorLabel})
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--color-gray-500)', display: 'flex', gap: 8, marginTop: 2 }}>
                            <span>الاتجاه: {u.direction}</span>
                            <span>•</span>
                            <span>الخدمات: {u.servicesFee} ₪</span>
                          </div>
                        </div>
                      </div>
                      <span className={`badge ${u.status === 'مأهولة' ? 'badge-green' : 'badge-gray'}`}>
                        {u.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Latest Residents with units badges */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">👥 أحدث السكان المسجلين</div>
            <Link to="/admin/residents" className="btn btn-ghost btn-sm">عرض الكل ({residents.length})</Link>
          </div>
          <div className="card-body">
            {residents.length === 0 ? (
              <div style={{ color: 'var(--color-gray-400)', fontSize: 13, textAlign: 'center', padding: 20 }}>
                لا يوجد سكان مسجلون بعد
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {residents.slice(0, 5).map(r => (
                  <div
                    key={r.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      background: 'var(--color-gray-50)',
                      borderRadius: 8,
                      border: '1px solid var(--color-gray-200)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--color-gray-900)' }}>
                        {r.fullName}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-gray-500)', marginTop: 2 }} dir="ltr">
                        {r.primaryPhone}
                      </div>
                    </div>
                    <div>
                      {r.units.length > 0 ? (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {r.units.map(u => {
                            const cat = u.unitCategory || (u.unitNumber.includes('حاصل') ? 'حاصل' : 'شقة');
                            return (
                              <span
                                key={u.unitId}
                                className={`badge ${cat === 'حاصل' ? 'badge-blue' : 'badge-green'}`}
                                style={{ fontSize: 11, padding: '2px 6px' }}
                              >
                                {cat === 'حاصل' ? '🏪 حاصل' : '🏠 شقة'} {u.unitNumber}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="badge badge-gray" style={{ fontSize: 11 }}>غير مربوط</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
