import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { Unit, Resident } from '../../types';
import { useNavigate } from 'react-router-dom';
import {
  FiHome, FiShoppingBag, FiPackage, FiUser, FiUsers,
  FiDollarSign, FiMaximize2, FiCompass, FiLayers,
  FiChevronDown, FiChevronUp, FiEye
} from 'react-icons/fi';

/* ===================== أنواع مساعدة ===================== */
interface FloorGroup {
  floor: number;
  label: string;
  units: Unit[];
}

function getFloorLabel(floor: number): string {
  if (floor === -2) return 'طابق تسوية ثاني (B2)';
  if (floor === -1) return 'طابق تسوية (B1)';
  if (floor === 0) return 'الطابق الأرضي (Ground)';
  if (floor === 999) return 'الروف (Roof)';
  return `الطابق ${floor}`;
}

function getFloorIcon(floor: number): string {
  if (floor === 999) return '🏔️';
  if (floor === 0) return '🏪';
  if (floor < 0) return '🅿️';
  return String(floor);
}

function getCategoryColor(cat?: string): string {
  if (cat === 'حاصل') return '#2563EB';
  if (cat === 'مخزن') return '#7C3AED';
  return '#059669';
}

function getCategoryIcon(cat?: string): React.ReactNode {
  if (cat === 'حاصل') return <FiShoppingBag size={12} />;
  if (cat === 'مخزن') return <FiPackage size={12} />;
  return <FiHome size={12} />;
}

/* ===================== UnitCard ===================== */
interface UnitCardProps {
  unit: Unit;
  resident?: Resident;
  onClick: () => void;
}

const UnitCard: React.FC<UnitCardProps> = ({ unit, resident, onClick }) => {
  const cat = unit.unitCategory || 'شقة';
  const color = getCategoryColor(cat);
  const isOccupied = unit.status === 'مأهولة';
  const isRent = unit.type === 'إيجار';

  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        background: isOccupied ? '#FFFFFF' : 'rgba(248,250,252,0.8)',
        border: `2px solid ${isOccupied ? color : '#CBD5E1'}`,
        borderRadius: 12,
        padding: '12px 14px',
        textAlign: 'right',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: isOccupied ? `0 2px 12px ${color}22` : '0 1px 3px rgba(0,0,0,0.04)',
        width: '100%',
        minWidth: 130,
      }}
    >
      {/* شارة الفئة */}
      <div style={{
        position: 'absolute', top: 7, left: 7,
        display: 'flex', alignItems: 'center', gap: 3,
        background: `${color}15`,
        color: color,
        padding: '2px 6px', borderRadius: 20,
        fontSize: 10, fontWeight: 800,
      }}>
        {getCategoryIcon(cat)}
        <span>{cat}</span>
      </div>

      {/* رقم الوحدة */}
      <div style={{ marginTop: 22, fontSize: 19, fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>
        {unit.unitNumber}
      </div>

      {/* الاتجاه والمساحة */}
      <div style={{ fontSize: 11, color: '#64748B', marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span><FiCompass size={10} style={{ verticalAlign: 'middle' }} /> {unit.direction}</span>
        <span><FiMaximize2 size={10} style={{ verticalAlign: 'middle' }} /> {unit.area}م²</span>
      </div>

      {/* الحالة والنوع */}
      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
          background: isOccupied ? '#D1FAE5' : '#FEF3C7',
          color: isOccupied ? '#065F46' : '#92400E',
        }}>
          {isOccupied ? '● مأهولة' : '○ شاغرة'}
        </span>
        <span style={{ fontSize: 10, color: isRent ? '#2563EB' : '#059669', fontWeight: 700 }}>
          {isRent ? '📝 إيجار' : 'ملك'}
        </span>
      </div>

      {/* اسم الساكن */}
      {isOccupied && resident && (
        <div style={{
          marginTop: 6, fontSize: 11, color: '#1E40AF', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 4,
          background: '#EFF6FF', borderRadius: 6, padding: '3px 6px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          <FiUser size={10} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{resident.fullName}</span>
        </div>
      )}
    </button>
  );
};

/* ===================== FloorSection ===================== */
interface FloorSectionProps {
  group: FloorGroup;
  residentMap: Map<string, Resident>;
  onUnitClick: (unit: Unit) => void;
}

const FloorSection: React.FC<FloorSectionProps> = ({ group, residentMap, onUnitClick }) => {
  const [collapsed, setCollapsed] = useState(false);

  const occupied = group.units.filter(u => u.status === 'مأهولة').length;
  const vacant = group.units.length - occupied;

  const apartments = group.units.filter(u => !u.unitCategory || u.unitCategory === 'شقة');
  const stores = group.units.filter(u => u.unitCategory === 'حاصل');
  const storages = group.units.filter(u => u.unitCategory === 'مخزن');
  const others = group.units.filter(u => u.unitCategory === 'موقف');

  const unitGrid = (units: Unit[]) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
      {units.map(u => (
        <UnitCard
          key={u.id}
          unit={u}
          resident={residentMap.get(u.id)}
          onClick={() => onUnitClick(u)}
        />
      ))}
    </div>
  );

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1.5px solid #E2E8F0',
      borderRadius: 16,
      marginBottom: 14,
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
    }}>
      {/* رأس الطابق */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '14px 20px',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          border: 'none', cursor: 'pointer', gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 12,
            background: 'rgba(255,255,255,0.1)',
            border: '1.5px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: group.floor >= 10 ? 13 : 20, fontWeight: 900, color: '#FFFFFF', flexShrink: 0,
          }}>
            {getFloorIcon(group.floor)}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#F8FAFC' }}>{group.label}</div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2, display: 'flex', gap: 10 }}>
              <span style={{ color: '#34D399' }}>● {occupied} مأهولة</span>
              <span style={{ color: '#FCA5A5' }}>○ {vacant} شاغرة</span>
              <span style={{ color: '#CBD5E1' }}>| {group.units.length} وحدة</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {apartments.length > 0 && <span style={{ background: '#D1FAE5', color: '#065F46', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>🏠 شقق</span>}
          {stores.length > 0 && <span style={{ background: '#DBEAFE', color: '#1E40AF', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>🏪 حواصل</span>}
          {storages.length > 0 && <span style={{ background: '#EDE9FE', color: '#5B21B6', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>📦 مخازن</span>}
          <div style={{ color: '#94A3B8', marginLeft: 4 }}>
            {collapsed ? <FiChevronDown size={20} /> : <FiChevronUp size={20} />}
          </div>
        </div>
      </button>

      {/* محتوى الطابق */}
      {!collapsed && (
        <div style={{ padding: '16px 20px', background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {apartments.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#059669', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiHome size={13} /> الشقق السكنية ({apartments.length})
              </div>
              {unitGrid(apartments)}
            </div>
          )}
          {stores.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiShoppingBag size={13} /> الحواصل التجارية ({stores.length})
              </div>
              {unitGrid(stores)}
            </div>
          )}
          {storages.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiPackage size={13} /> المخازن ({storages.length})
              </div>
              {unitGrid(storages)}
            </div>
          )}
          {others.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#D97706', marginBottom: 10 }}>🅿️ المواقف ({others.length})</div>
              {unitGrid(others)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ===================== UnitDetailModal ===================== */
interface UnitDetailModalProps {
  unit: Unit | null;
  resident?: Resident;
  onClose: () => void;
}

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
    <span style={{ color: '#94A3B8' }}>{icon}</span>
    <span style={{ color: '#64748B' }}>{label}:</span>
    <strong style={{ color: '#1E293B' }}>{value}</strong>
  </div>
);

const UnitDetailModal: React.FC<UnitDetailModalProps> = ({ unit, resident, onClose }) => {
  if (!unit) return null;
  const cat = unit.unitCategory || 'شقة';
  const color = getCategoryColor(cat);
  const isRent = unit.type === 'إيجار';

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF', borderRadius: 20,
          maxWidth: 520, width: '100%',
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${color} 0%, ${color}BB 100%)`,
          padding: '20px 24px',
          borderRadius: '20px 20px 0 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
              {cat} · {getFloorLabel(unit.floor)}
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#FFFFFF', marginTop: 2 }}>
              {unit.unitNumber}
            </div>
            <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
              <span style={{
                background: unit.status === 'مأهولة' ? '#D1FAE5' : '#FEF3C7',
                color: unit.status === 'مأهولة' ? '#065F46' : '#92400E',
                fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20,
              }}>
                {unit.status === 'مأهولة' ? '● مأهولة' : '○ شاغرة'}
              </span>
              <span style={{
                background: 'rgba(255,255,255,0.22)',
                color: '#FFFFFF', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
              }}>
                {isRent ? '📝 إيجار' : 'ملك'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 18, fontWeight: 700 }}
          >✕</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* المعلومات الأساسية */}
          <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 10 }}>📋 المعلومات الأساسية</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <InfoRow icon={<FiLayers size={13} />} label="الطابق" value={getFloorLabel(unit.floor)} />
              <InfoRow icon={<FiCompass size={13} />} label="الاتجاه" value={unit.direction} />
              <InfoRow icon={<FiMaximize2 size={13} />} label="المساحة" value={`${unit.area} م²`} />
              <InfoRow icon={<FiDollarSign size={13} />} label="رسوم الخدمات" value={`${unit.servicesFee} ₪`} />
            </div>
          </div>

          {/* ملكية */}
          {!isRent && unit.ownerInfo && (
            <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#166534', marginBottom: 8 }}>👑 بيانات المالك</div>
              <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div>الاسم: <strong>{unit.ownerInfo.name}</strong></div>
                <div>الجوال: <strong>{unit.ownerInfo.phone}</strong></div>
                {unit.ownerInfo.idNumber && <div>رقم الهوية: <strong>{unit.ownerInfo.idNumber}</strong></div>}
              </div>
            </div>
          )}

          {/* إيجار */}
          {isRent && unit.leaseInfo && (
            <>
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#1E40AF', marginBottom: 8 }}>🏢 المؤجر (المالك)</div>
                <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div>الاسم: <strong>{unit.leaseInfo.landlordName}</strong></div>
                  <div>الجوال: <strong>{unit.leaseInfo.landlordPhone}</strong></div>
                  {unit.leaseInfo.landlordIdNumber && <div>رقم الهوية: <strong>{unit.leaseInfo.landlordIdNumber}</strong></div>}
                </div>
              </div>
              <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#5B21B6', marginBottom: 8 }}>👤 المستأجر</div>
                <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div>الاسم: <strong>{unit.leaseInfo.tenantName}</strong></div>
                  <div>الجوال: <strong>{unit.leaseInfo.tenantPhone}</strong></div>
                  {unit.leaseInfo.tenantIdNumber && <div>رقم الهوية: <strong>{unit.leaseInfo.tenantIdNumber}</strong></div>}
                </div>
              </div>
              <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#92400E', marginBottom: 8 }}>📜 تفاصيل العقد</div>
                <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {unit.leaseInfo.duration && <div>مدة العقد: <strong>{unit.leaseInfo.duration}</strong></div>}
                  {unit.leaseInfo.startDate && <div>البداية: <strong>{unit.leaseInfo.startDate}</strong></div>}
                  {unit.leaseInfo.endDate && <div>الانتهاء: <strong>{unit.leaseInfo.endDate}</strong></div>}
                  {unit.leaseInfo.monthlyRent ? <div>الإيجار الشهري: <strong>{unit.leaseInfo.monthlyRent} ₪</strong></div> : null}
                  {unit.leaseInfo.notes && <div>ملاحظات: <strong>{unit.leaseInfo.notes}</strong></div>}
                </div>
              </div>
            </>
          )}

          {/* الساكن المرتبط */}
          {resident && (
            <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0C4A6E', marginBottom: 8 }}>
                <FiUsers size={12} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
                الساكن المرتبط بالنظام
              </div>
              <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div>الاسم: <strong>{resident.fullName}</strong></div>
                <div>الجوال: <strong>{resident.primaryPhone}</strong></div>
                <div>رقم الهوية: <strong>{resident.idNumber}</strong></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ===================== الصفحة الرئيسية ===================== */
const BuildingTree: React.FC = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [filterCat, setFilterCat] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubUnits = onSnapshot(collection(db, 'units'), snap => {
      setUnits(snap.docs.map(d => ({ id: d.id, ...d.data() } as Unit)));
      setLoading(false);
    });
    const unsubResidents = onSnapshot(collection(db, 'residents'), snap => {
      setResidents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Resident)));
    });
    return () => { unsubUnits(); unsubResidents(); };
  }, []);

  // خريطة: unitId → Resident
  const residentMap = new Map<string, Resident>();
  residents.forEach(r => r.units?.forEach(u => residentMap.set(u.unitId, r)));

  // تصفية حسب الفئة
  const filteredUnits = filterCat === 'all'
    ? units
    : units.filter(u => (u.unitCategory || 'شقة') === filterCat);

  // تجميع حسب الطابق (من الأعلى للأسفل)
  const floorMap = new Map<number, Unit[]>();
  filteredUnits.forEach(u => {
    const f = u.floor ?? 0;
    if (!floorMap.has(f)) floorMap.set(f, []);
    floorMap.get(f)!.push(u);
  });

  const floorGroups: FloorGroup[] = Array.from(floorMap.entries())
    .sort(([a], [b]) => b - a)
    .map(([floor, us]) => ({
      floor,
      label: getFloorLabel(floor),
      units: us.sort((a, b) => a.unitNumber.localeCompare(b.unitNumber, 'ar', { numeric: true })),
    }));

  // إحصائيات
  const occupied = units.filter(u => u.status === 'مأهولة').length;
  const vacant = units.length - occupied;
  const floorsCount = new Set(units.map(u => u.floor)).size;

  return (
    <div>
      {/* رأس الصفحة */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-header-title">🏢 شجرة العمارة</h1>
          <div className="page-header-sub">عرض بصري تفصيلي لجميع طوابق العمارة وشققها وحواصلها</div>
        </div>
        <div className="page-header-actions">
          <button onClick={() => navigate('/admin/units')} className="btn btn-ghost btn-sm">
            <FiEye size={15} style={{ marginLeft: 4 }} /> إدارة الوحدات
          </button>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'إجمالي الوحدات', value: units.length, icon: '🏠', color: '#0F172A' },
          { label: 'مأهولة', value: occupied, icon: '✅', color: '#059669' },
          { label: 'شاغرة', value: vacant, icon: '🔲', color: '#D97706' },
          { label: 'عدد الطوابق', value: floorsCount, icon: '🏗️', color: '#6366F1' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--color-gray-500)', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* فلتر الفئات */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: '🏢 الكل' },
          { key: 'شقة', label: '🏠 شقق سكنية' },
          { key: 'حاصل', label: '🏪 حواصل تجارية' },
          { key: 'مخزن', label: '📦 مخازن' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilterCat(f.key)}
            className={filterCat === f.key ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
            style={{ fontSize: 13 }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* محتوى الشجرة */}
      {loading ? (
        <div className="loading-screen" style={{ minHeight: 300 }}>
          <div className="loading-spinner" />
          <p>جارٍ تحميل بيانات العمارة...</p>
        </div>
      ) : floorGroups.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🏗️</div>
            <div className="empty-state-title">لا توجد وحدات مسجلة بعد</div>
            <div className="empty-state-sub">ابدأ بإضافة الشقق والحواصل من صفحة إدارة الوحدات</div>
            <button onClick={() => navigate('/admin/units')} className="btn btn-primary" style={{ marginTop: 16 }}>
              + إضافة وحدة
            </button>
          </div>
        </div>
      ) : (
        <div>
          {floorGroups.map(group => (
            <FloorSection
              key={group.floor}
              group={group}
              residentMap={residentMap}
              onUnitClick={setSelectedUnit}
            />
          ))}
        </div>
      )}

      {/* مودال تفاصيل الوحدة */}
      {selectedUnit && (
        <UnitDetailModal
          unit={selectedUnit}
          resident={residentMap.get(selectedUnit.id)}
          onClose={() => setSelectedUnit(null)}
        />
      )}
    </div>
  );
};

export default BuildingTree;
