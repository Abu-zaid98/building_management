import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { getResidents } from '../../services/residents';
import { getUnits } from '../../services/units';
import { getInvoices } from '../../services/invoices';
import { useBuildingInfo } from '../../services/buildingInfo';
import type { Invoice, Resident, Unit } from '../../types';
import { FiHome, FiFileText, FiDollarSign, FiMessageSquare, FiBell, FiUser, FiCompass, FiMaximize2, FiLayers } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const ResidentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { buildingInfo } = useBuildingInfo();
  const { newAnnouncementsCount } = useNotifications();
  const [resident, setResident] = useState<Resident | null>(null);
  const [residentUnits, setResidentUnits] = useState<Unit[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const buildingName = buildingInfo?.buildingName || 'عمارة السكن';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [allResidents, allUnits, allInvoices] = await Promise.all([
          getResidents(),
          getUnits(),
          getInvoices()
        ]);

        const currentRes = allResidents.find(r => r.email === user?.email || r.idNumber === user?.displayName);

        if (currentRes) {
          setResident(currentRes);
          const resInvoices = allInvoices.filter(i => i.residentId === currentRes.id);
          setInvoices(resInvoices);

          // Get full unit details
          const residentUnitIds = currentRes.units.map(u => u.unitId);
          const matchedUnits = allUnits.filter(u => residentUnitIds.includes(u.id));
          setResidentUnits(matchedUnits);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const unitsCount = residentUnits.length || resident?.units.length || 0;
  const pendingInvoices = invoices.filter(i => i.status !== 'paid');
  const pendingAmount = pendingInvoices.reduce((acc, i) => acc + i.amount, 0);

  const quickLinks = [
    { icon: <FiHome size={24} />, label: 'شققي ووحداتي', sub: 'عرض تفاصيل شققك والحواصل', to: '/resident/units', color: 'green' },
    { icon: <FiFileText size={24} />, label: 'الخدمات الشهرية والفواتير', sub: 'فواتيرك وإيصالات الدفع', to: '/resident/invoices', color: 'orange' },
    { icon: <FiMessageSquare size={24} />, label: 'اقتراح / شكوى', sub: 'تواصل مع الإدارة', to: '/resident/suggestion', color: 'green' },
    { icon: <FiBell size={24} />, label: 'الإعلانات', sub: 'آخر الأخبار والتعميمات', to: '/resident/announcements', color: 'blue' },
    { icon: <FiUser size={24} />, label: 'ملفي الشخصي', sub: 'بياناتك وكلمة المرور', to: '/resident/profile', color: 'orange' },
  ];

  const colorMap: Record<string, string> = {
    green: 'var(--color-primary-100)',
    blue: 'var(--color-info-light)',
    orange: 'var(--color-warning-light)',
  };

  const textColorMap: Record<string, string> = {
    green: 'var(--color-primary-dark)',
    blue: 'var(--color-info)',
    orange: 'var(--color-warning)',
  };

  return (
    <div>
      {/* Welcome & Building Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, #1e293b 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px',
        color: '#ffffff',
        marginBottom: 24,
        boxShadow: 'var(--shadow-md)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
              🏢 {buildingName}
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', marginBottom: 6 }}>
              أهلاً وسهلاً بك، {resident?.fullName || user?.displayName || 'الساكن المحترم'} 👋
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>
              بوابة الخدمات الإلكترونية الموحدة لسكان {buildingName}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 800,
              border: '2px solid rgba(255, 255, 255, 0.4)'
            }}>
              {(resident?.fullName || user?.displayName || 'س')[0]}
            </div>
          </div>
        </div>
      </div>

      {/* Active Notifications & Action Banners for Resident */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {/* Unpaid Invoices Alert */}
        {pendingAmount > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #FEF2F2 0%, #FFF1F2 100%)',
              border: '1.5px solid #FCA5A5',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 18px',
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
                🧾
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#991B1B' }}>
                  تنبيه: لديك ({pendingInvoices.length}) فواتير مستحقة الدفع بإجمالي ({pendingAmount} ₪)
                </div>
                <div style={{ fontSize: 12, color: '#B91C1C', marginTop: 2 }}>
                  يرجى المبادرة بسداد الرسوم والخدمات الشهرية لضمان استمرارية الخدمات
                </div>
              </div>
            </div>
            <Link
              to="/resident/invoices"
              className="btn btn-primary btn-sm"
              style={{ background: '#DC2626', borderColor: '#B91C1C' }}
            >
              عرض الفواتير والسداد ←
            </Link>
          </div>
        )}

        {/* New Announcements Alert */}
        {newAnnouncementsCount > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
              border: '1.5px solid #93C5FD',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 18px',
              boxShadow: '0 2px 10px rgba(59, 130, 246, 0.08)',
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
                  background: '#3B82F6',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                📢
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#1E40AF' }}>
                  تنبيه: يوجد ({newAnnouncementsCount}) إعلانات وقرارات جديدة صادرة من الإدارة!
                </div>
                <div style={{ fontSize: 12, color: '#1D4ED8', marginTop: 2 }}>
                  اطلع على آخر التوجيهات والقرارات الخاصة بسكان العمارة
                </div>
              </div>
            </div>
            <Link
              to="/resident/announcements"
              className="btn btn-primary btn-sm"
              style={{ background: '#2563EB', borderColor: '#1D4ED8' }}
            >
              قراءة الإعلانات ←
            </Link>
          </div>
        )}
      </div>

      {/* Resident Info & Units Banner */}
      <div className="card" style={{ marginBottom: 24, border: '1.5px solid var(--color-primary-200)', background: '#F8FAFC' }}>
        <div className="card-header" style={{ background: '#FFFFFF' }}>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16 }}>
            <span>📋 بيانات الساكن والوحدات التابعة لك:</span>
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Resident Personal Details */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, paddingBottom: 12, borderBottom: '1px solid var(--color-slate-200)' }}>
              <div>
                <span style={{ fontSize: 12, color: 'var(--color-gray-500)', display: 'block' }}>الاسم الكامل</span>
                <strong style={{ fontSize: 15, color: 'var(--color-gray-900)' }}>{resident?.fullName || user?.displayName || 'غير محدد'}</strong>
              </div>
              <div>
                <span style={{ fontSize: 12, color: 'var(--color-gray-500)', display: 'block' }}>رقم الهوية</span>
                <code style={{ fontSize: 14, color: 'var(--color-primary-dark)', fontWeight: 700 }}>{resident?.idNumber || '—'}</code>
              </div>
              <div>
                <span style={{ fontSize: 12, color: 'var(--color-gray-500)', display: 'block' }}>رقم الجوال</span>
                <strong style={{ fontSize: 14, color: 'var(--color-gray-800)' }} dir="ltr">{resident?.primaryPhone || '—'}</strong>
              </div>
            </div>

            {/* Units & Directions Display */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-gray-700)', marginBottom: 10 }}>
                🏢 الوحدات المسجلة باسمك (شقق / حواصل):
              </div>

              {loading ? (
                <div style={{ fontSize: 13, color: 'var(--color-gray-500)' }}>جارٍ تحميل تفاصيل الوحدات...</div>
              ) : residentUnits.length > 0 ? (
                <div className="grid-2" style={{ gap: 12 }}>
                  {residentUnits.map(unit => {
                    const category = unit.unitCategory || (unit.floor === 0 ? 'حاصل' : 'شقة');
                    const isStore = category === 'حاصل' || category === 'مخزن';
                    return (
                      <div
                        key={unit.id}
                        style={{
                          background: '#ffffff',
                          border: '1.5px solid var(--color-gray-200)',
                          borderRadius: 'var(--radius-lg)',
                          padding: '14px 16px',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className={`badge ${isStore ? 'badge-blue' : 'badge-green'}`} style={{ fontSize: 12 }}>
                              {isStore ? (category === 'حاصل' ? '🏪 حاصل تجاري' : '📦 مخزن') : '🏠 شقة سكنية'}
                            </span>
                            <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--color-gray-900)' }}>
                              رقم {unit.unitNumber}
                            </span>
                          </div>
                          <span className="badge badge-green" style={{ fontSize: 11 }}>
                            {unit.type}
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 13, color: 'var(--color-gray-700)', marginTop: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FiCompass style={{ color: 'var(--color-primary)' }} />
                            <span>الاتجاه: <strong style={{ color: 'var(--color-primary-dark)' }}>{unit.direction}</strong></span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FiLayers style={{ color: 'var(--color-primary)' }} />
                            <span>الطابق: <strong>{unit.floor === 0 ? 'الأرضي (0)' : unit.floor}</strong></span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FiMaximize2 style={{ color: 'var(--color-primary)' }} />
                            <span>المساحة: <strong>{unit.area} م²</strong></span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FiDollarSign style={{ color: 'var(--color-primary)' }} />
                            <span>الخدمات: <strong>{unit.servicesFee} ₪</strong></span>
                          </div>
                        </div>

                        {/* إظهار تفاصيل المؤجر ومدة العقد إذا كان إيجار */}
                        {unit.type === 'إيجار' && (
                          <div style={{ marginTop: 10, padding: 8, background: '#EFF6FF', borderRadius: 8, fontSize: 12, color: '#1E40AF' }}>
                            <div>🏢 المؤجر: <strong>{unit.leaseInfo?.landlordName || unit.ownerInfo?.name || 'مسجل لدى الإدارة'}</strong></div>
                            {(unit.leaseInfo?.duration || unit.leaseInfo?.startDate) && (
                              <div style={{ marginTop: 2 }}>📅 مدة العقد: <strong>{unit.leaseInfo.duration || 'ساري'}</strong></div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : resident?.units && resident.units.length > 0 ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {resident.units.map(u => (
                    <span key={u.unitId} className="badge badge-green" style={{ fontSize: 13, padding: '6px 12px' }}>
                      {u.unitCategory || 'شقة'} رقم {u.unitNumber} {u.direction ? `(اتجاه ${u.direction})` : ''}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--color-gray-500)', background: '#fff', padding: 12, borderRadius: 8 }}>
                  لم يتم ربط شقة أو حاصل بعد. يرجى التواصل مع إدارة العمارة لتحديث بياناتك.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🏠</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-gray-900)' }}>
            {loading ? '...' : unitsCount}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-gray-700)', marginTop: 4 }}>الوحدات المسجلة</div>
          <div style={{ fontSize: 12, color: 'var(--color-gray-400)', marginTop: 2 }}>شقق أو حواصل باسمك</div>
        </div>

        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>💰</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: pendingAmount > 0 ? 'var(--color-danger)' : 'var(--color-primary-dark)' }}>
            {loading ? '...' : `${pendingAmount} ₪`}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-gray-700)', marginTop: 4 }}>مستحقات معلقة</div>
          <div style={{ fontSize: 12, color: 'var(--color-gray-400)', marginTop: 2 }}>{pendingInvoices.length} فواتير بانتظار الدفع</div>
        </div>

        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-gray-900)' }}>
            {loading ? '...' : invoices.filter(i => i.status === 'paid').length}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-gray-700)', marginTop: 4 }}>فواتير مدفوعة</div>
          <div style={{ fontSize: 12, color: 'var(--color-gray-400)', marginTop: 2 }}>مسددة بنجاح</div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">🔗 الخدمات السريعة</div>
        </div>
        <div className="card-body">
          <div className="grid-3" style={{ gap: 12 }}>
            {quickLinks.map((link, idx) => (
              <Link
                key={idx}
                to={link.to}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  padding: '20px 16px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1.5px solid var(--color-gray-200)',
                  textDecoration: 'none',
                  background: colorMap[link.color],
                  transition: 'var(--transition)',
                  textAlign: 'center',
                }}
              >
                <span style={{ color: textColorMap[link.color] }}>{link.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--color-gray-900)', fontSize: 14 }}>{link.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-gray-500)', marginTop: 2 }}>{link.sub}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResidentDashboard;
