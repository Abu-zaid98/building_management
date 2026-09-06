import React, { useState, useEffect } from 'react';
import type { Unit, UnitFormData, OwnerInfo, LeaseInfo } from '../../types';

interface UnitFormProps {
  initialData?: Unit | null;
  onSubmit: (data: UnitFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const UnitForm: React.FC<UnitFormProps> = ({ initialData, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState<UnitFormData>({
    unitNumber: '',
    unitCategory: 'شقة',
    floor: 1,
    direction: 'شمال',
    area: 100,
    type: 'ملك',
    servicesFee: 150,
    status: 'شاغرة',
    ownerInfo: { id: '', name: '', phone: '', idNumber: '' },
    leaseInfo: {
      landlordName: '',
      landlordPhone: '',
      landlordIdNumber: '',
      tenantName: '',
      tenantPhone: '',
      tenantIdNumber: '',
      startDate: '',
      endDate: '',
      duration: '',
      monthlyRent: 0,
      notes: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        unitNumber: initialData.unitNumber || '',
        unitCategory: initialData.unitCategory || (initialData.floor === 0 ? 'حاصل' : 'شقة'),
        floor: initialData.floor !== undefined ? initialData.floor : 1,
        direction: initialData.direction || 'شمال',
        area: initialData.area || 100,
        type: initialData.type || 'ملك',
        servicesFee: initialData.servicesFee || 150,
        status: initialData.status || 'شاغرة',
        ownerInfo: initialData.ownerInfo || { id: '', name: '', phone: '', idNumber: '' },
        leaseInfo: initialData.leaseInfo || {
          landlordName: initialData.ownerInfo?.name || '',
          landlordPhone: initialData.ownerInfo?.phone || '',
          landlordIdNumber: initialData.ownerInfo?.idNumber || '',
          tenantName: '',
          tenantPhone: '',
          tenantIdNumber: '',
          startDate: '',
          endDate: '',
          duration: '',
          monthlyRent: 0,
          notes: '',
        },
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Category Selection */}
      <div className="form-group">
        <label className="form-label required">نوع العقار / الوحدة</label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { value: 'شقة', label: '🏠 شقة سكنية', defaultFloor: 1 },
            { value: 'حاصل', label: '🏪 حاصل / محل تجاري (طابق أرضي)', defaultFloor: 0 },
            { value: 'مخزن', label: '📦 مخزن / خدمات', defaultFloor: 0 },
            { value: 'موقف', label: '🚗 موقف سيارة', defaultFloor: 0 },
          ].map(cat => (
            <button
              key={cat.value}
              type="button"
              onClick={() => {
                setFormData({
                  ...formData,
                  unitCategory: cat.value as any,
                  floor: cat.value === 'حاصل' || cat.value === 'مخزن' || cat.value === 'موقف' ? 0 : formData.floor === 0 ? 1 : formData.floor
                });
              }}
              className={`btn btn-sm ${formData.unitCategory === cat.value ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: '1 1 auto', justifyContent: 'center' }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label required">
            {formData.unitCategory === 'حاصل' ? 'رقم / اسم الحاصل' : formData.unitCategory === 'مخزن' ? 'رقم المخزن' : 'رقم الشقة'}
          </label>
          <input
            type="text"
            className="form-input"
            placeholder={formData.unitCategory === 'حاصل' ? 'مثال: حاصل 1 أو محل 2' : 'مثال: 101 أو 202'}
            value={formData.unitNumber}
            onChange={e => setFormData({ ...formData, unitNumber: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label required">الطابق</label>
          <select
            className="form-select"
            value={formData.floor}
            onChange={e => setFormData({ ...formData, floor: Number(e.target.value) })}
          >
            <option value={0}>الطابق الأرضي (0) - حواصل / محلات</option>
            <option value={1}>الطابق الأول (1)</option>
            <option value={2}>الطابق الثاني (2)</option>
            <option value={3}>الطابق الثالث (3)</option>
            <option value={4}>الطابق الرابع (4)</option>
            <option value={5}>الطابق الخامس (5)</option>
            <option value={6}>الطابق السادس (6)</option>
            <option value={7}>الطابق السابع (7)</option>
            <option value={8}>الطابق الثامن (8)</option>
            <option value={9}>الطابق التاسع (9)</option>
            <option value={10}>الطابق العاشر (10)</option>
            <option value={-1}>طابق التسوية / القبو (-1)</option>
          </select>
        </div>
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label required">الاتجاه / الواجهة</label>
          <select
            className="form-select"
            value={formData.direction}
            onChange={e => setFormData({ ...formData, direction: e.target.value as any })}
          >
            <option value="شمال">شمال (واجهة شمالية)</option>
            <option value="جنوب">جنوب (واجهة جنوبية)</option>
            <option value="شرق">شرق (واجهة شرقية)</option>
            <option value="غرب">غرب (واجهة غربية)</option>
            <option value="شمال غرب">شمال غرب</option>
            <option value="شمال شرق">شمال شرق</option>
            <option value="جنوب غرب">جنوب غرب</option>
            <option value="جنوب شرق">جنوب شرق</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label required">المساحة (م²)</label>
          <input
            type="number"
            className="form-input"
            min={1}
            value={formData.area}
            onChange={e => setFormData({ ...formData, area: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label required">نوع الإشغال والملكية</label>
          <select
            className="form-select"
            value={formData.type}
            onChange={e => setFormData({ ...formData, type: e.target.value as any })}
            style={{ fontWeight: 700 }}
          >
            <option value="ملك"> ملك (مالك أصلي)</option>
            <option value="إيجار">📝 إيجار (مستأجر ومؤجر بعقد)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label required">رسوم الخدمات الشهرية (₪)</label>
          <input
            type="number"
            className="form-input"
            min={0}
            value={formData.servicesFee}
            onChange={e => setFormData({ ...formData, servicesFee: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label required">الحالة</label>
        <select
          className="form-select"
          value={formData.status}
          onChange={e => setFormData({ ...formData, status: e.target.value as any })}
        >
          <option value="شاغرة">شاغرة</option>
          <option value="مأهولة">مأهولة</option>
        </select>
      </div>

      {/* ===== الحالة الأولى: إذا كانت ملك (بيانات المالك فقط) ===== */}
      {formData.type === 'ملك' && (
        <div style={{
          background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
          padding: 18,
          borderRadius: 'var(--radius-lg)',
          border: '1.5px solid #86EFAC',
          boxShadow: '0 2px 8px rgba(34, 197, 94, 0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 20 }}>👑</span>
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: '#166534', margin: 0 }}>بيانات المالك (ملك أصلي)</h4>
              <span style={{ fontSize: 12, color: '#15803D' }}>يتم تسجيل بيانات مالك العقار مباشرة</span>
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label required" style={{ color: '#14532D' }}>اسم المالك</label>
              <input
                type="text"
                className="form-input"
                placeholder="اسم المالك الكامل"
                value={formData.ownerInfo?.name || ''}
                onChange={e => setFormData({
                  ...formData,
                  ownerInfo: { ...formData.ownerInfo, id: formData.ownerInfo?.id || '', phone: formData.ownerInfo?.phone || '', idNumber: formData.ownerInfo?.idNumber || '', name: e.target.value }
                })}
              />
            </div>

            <div className="form-group">
              <label className="form-label required" style={{ color: '#14532D' }}>رقم جوال المالك</label>
              <input
                type="tel"
                className="form-input"
                placeholder="059xxxxxxx"
                value={formData.ownerInfo?.phone || ''}
                onChange={e => setFormData({
                  ...formData,
                  ownerInfo: { ...formData.ownerInfo, id: formData.ownerInfo?.id || '', name: formData.ownerInfo?.name || '', idNumber: formData.ownerInfo?.idNumber || '', phone: e.target.value }
                })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: '#14532D' }}>رقم هوية المالك (اختياري)</label>
              <input
                type="text"
                className="form-input"
                placeholder="رقم الهوية"
                value={formData.ownerInfo?.idNumber || ''}
                onChange={e => setFormData({
                  ...formData,
                  ownerInfo: { ...formData.ownerInfo, id: formData.ownerInfo?.id || '', name: formData.ownerInfo?.name || '', phone: formData.ownerInfo?.phone || '', idNumber: e.target.value }
                })}
              />
            </div>
          </div>
        </div>
      )}

      {/* ===== الحالة الثانية: إذا كانت إيجار (بيانات المؤجر + المستأجر + مدة العقد) ===== */}
      {formData.type === 'إيجار' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 1. بيانات المؤجر (صاحب العقار / المالك) */}
          <div style={{
            background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
            padding: 18,
            borderRadius: 'var(--radius-lg)',
            border: '1.5px solid #93C5FD',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 20 }}>🏢</span>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: '#1E40AF', margin: 0 }}>1. بيانات المؤجر (صاحب العقار / المالك)</h4>
                <span style={{ fontSize: 12, color: '#1D4ED8' }}>بيانات المالك الأصلي الذي قام بتأجير الوحدة</span>
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label required" style={{ color: '#1E3A8A' }}>اسم المؤجر / المالك</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="اسم المؤجر الكامل"
                  value={formData.leaseInfo?.landlordName || ''}
                  onChange={e => setFormData({
                    ...formData,
                    leaseInfo: { ...formData.leaseInfo!, landlordName: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label required" style={{ color: '#1E3A8A' }}>رقم جوال المؤجر</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="059xxxxxxx"
                  value={formData.leaseInfo?.landlordPhone || ''}
                  onChange={e => setFormData({
                    ...formData,
                    leaseInfo: { ...formData.leaseInfo!, landlordPhone: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#1E3A8A' }}>رقم هوية المؤجر (اختياري)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="رقم هوية المؤجر"
                  value={formData.leaseInfo?.landlordIdNumber || ''}
                  onChange={e => setFormData({
                    ...formData,
                    leaseInfo: { ...formData.leaseInfo!, landlordIdNumber: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>

          {/* 2. بيانات المستأجر (الشاغل الحالي) */}
          <div style={{
            background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
            padding: 18,
            borderRadius: 'var(--radius-lg)',
            border: '1.5px solid #FDBA74',
            boxShadow: '0 2px 8px rgba(249, 115, 22, 0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 20 }}>👤</span>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: '#9A3412', margin: 0 }}>2. بيانات المستأجر (شاغل العقار الحالي)</h4>
                <span style={{ fontSize: 12, color: '#C2410C' }}>بيانات الشخص المستأجر المقيم في الوحدة</span>
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label required" style={{ color: '#7C2D12' }}>اسم المستأجر</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="اسم المستأجر الكامل"
                  value={formData.leaseInfo?.tenantName || ''}
                  onChange={e => setFormData({
                    ...formData,
                    leaseInfo: { ...formData.leaseInfo!, tenantName: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label required" style={{ color: '#7C2D12' }}>رقم جوال المستأجر</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="059xxxxxxx"
                  value={formData.leaseInfo?.tenantPhone || ''}
                  onChange={e => setFormData({
                    ...formData,
                    leaseInfo: { ...formData.leaseInfo!, tenantPhone: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#7C2D12' }}>رقم هوية المستأجر (اختياري)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="رقم هوية المستأجر"
                  value={formData.leaseInfo?.tenantIdNumber || ''}
                  onChange={e => setFormData({
                    ...formData,
                    leaseInfo: { ...formData.leaseInfo!, tenantIdNumber: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12, flexWrap: 'wrap' }}>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: '1 1 140px' }}>
          {loading ? 'جارٍ الحفظ...' : initialData ? `تحديث ${formData.unitCategory || 'الوحدة'}` : `إضافة ${formData.unitCategory || 'الوحدة'}`}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={loading} style={{ flex: '1 1 100px' }}>
          إلغاء
        </button>
      </div>
    </form>
  );
};

export default UnitForm;
