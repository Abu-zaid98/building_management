import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getResidents } from '../../services/residents';
import { getUnits } from '../../services/units';
import type { Unit, Resident } from '../../types';
import { FiHome, FiMaximize2, FiCompass, FiDollarSign } from 'react-icons/fi';

const ResidentUnits: React.FC = () => {
  const { user } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResidentUnits = async () => {
      try {
        setLoading(true);
        const [allResidents, allUnits] = await Promise.all([getResidents(), getUnits()]);
        const currentResident = allResidents.find(r => r.email === user?.email || r.idNumber === user?.displayName);

        if (currentResident && currentResident.units.length > 0) {
          const residentUnitIds = currentResident.units.map(u => u.unitId);
          const filtered = allUnits.filter(u => residentUnitIds.includes(u.id));
          setUnits(filtered);
        } else {
          setUnits([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResidentUnits();
  }, [user]);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-header-title">🏢 شققي ووحداتي</h1>
          <div className="page-header-sub">عرض تفاصيل وحالة الشقق والحواصل التجارية التابعة لك في العمارة</div>
        </div>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 250 }}>
          <div className="loading-spinner" />
          <p>جارٍ تحميل بيانات الوحدات...</p>
        </div>
      ) : units.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <div className="empty-state-title">لا توجد وحدات مربوطة بحسابك</div>
            <div className="empty-state-sub">تواصل مع مجلس الإدارة لربط شقتك أو حاصلك برقم هويتك</div>
          </div>
        </div>
      ) : (
        <div className="grid-2">
          {units.map(unit => {
            const category = unit.unitCategory || (unit.floor === 0 ? 'حاصل' : 'شقة');
            const isStore = category === 'حاصل' || category === 'مخزن';
            return (
              <div key={unit.id} className="card">
                <div style={{ height: 6, background: isStore ? 'var(--color-info)' : 'var(--color-primary)' }} />
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className={`badge ${isStore ? 'badge-blue' : 'badge-green'}`} style={{ fontSize: 12 }}>
                          {isStore ? (category === 'حاصل' ? '🏪 حاصل' : '📦 مخزن') : '🏠 شقة'}
                        </span>
                        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-gray-900)' }}>
                          {unit.unitNumber.includes('حاصل') || unit.unitNumber.includes('شقة') ? unit.unitNumber : `${category} ${unit.unitNumber}`}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--color-gray-500)', marginTop: 4 }}>
                        {unit.floor === 0 ? 'الطابق الأرضي (0)' : unit.floor < 0 ? `طابق التسوية (${unit.floor})` : `الطابق ${unit.floor}`}
                      </div>
                    </div>
                    <span className="badge badge-green">مأهولة بحسابك</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FiCompass color="var(--color-primary)" /> الاتجاه: <strong>{unit.direction}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FiMaximize2 color="var(--color-primary)" /> المساحة: <strong>{unit.area} م²</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FiHome color="var(--color-primary)" /> نوع الإشغال: <strong className={unit.type === 'ملك' ? 'text-success' : 'text-primary'}>{unit.type === 'ملك' ? ' ملكك الخاص' : '📝 إيجار (عقد إيجار)'}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FiDollarSign color="var(--color-primary)" /> رسوم الخدمات الشهرية للعمارة: <strong>{unit.servicesFee} ₪</strong>
                    </div>

                    {/* تفاصيل إضافية في حال كان مستأجراً */}
                    {unit.type === 'إيجار' && (
                      <div style={{
                        marginTop: 8,
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        borderRadius: 8,
                        padding: '12px',
                        fontSize: 13,
                        color: '#1E40AF',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6
                      }}>
                        <div style={{ fontWeight: 800, color: '#1E3A8A', borderBottom: '1px dashed #93C5FD', paddingBottom: 4 }}>
                          📋 بيانات عقد الإيجار والمؤجر:
                        </div>
                        <div>
                          <strong>🏢 المؤجر (مالك العقار):</strong> {unit.leaseInfo?.landlordName || unit.ownerInfo?.name || 'مسجل لدى الإدارة'} {unit.leaseInfo?.landlordPhone ? `(${unit.leaseInfo.landlordPhone})` : ''}
                        </div>
                        {(unit.leaseInfo?.duration || unit.leaseInfo?.startDate) && (
                          <div>
                            <strong>📅 مدة العقد:</strong> {unit.leaseInfo.duration || 'ساري'}
                            {unit.leaseInfo.startDate && unit.leaseInfo.endDate && (
                              <span style={{ fontSize: 12, color: '#2563EB', marginRight: 4 }}>
                                ({unit.leaseInfo.startDate} إلى {unit.leaseInfo.endDate})
                              </span>
                            )}
                          </div>
                        )}
                        {unit.leaseInfo?.monthlyRent ? (
                          <div><strong>💵 قيمة الإيجار الشهري:</strong> {unit.leaseInfo.monthlyRent} ₪</div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ResidentUnits;
