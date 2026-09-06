import React, { useState, useEffect } from 'react';
import type { Resident, ResidentFormData, Unit } from '../../types';
import { getUnits } from '../../services/units';

interface ResidentFormProps {
  initialData?: Resident | null;
  onSubmit: (data: ResidentFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const ResidentForm: React.FC<ResidentFormProps> = ({ initialData, onSubmit, onCancel, loading }) => {
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');

  const [formData, setFormData] = useState<ResidentFormData>({
    fullName: '',
    idNumber: '',
    primaryPhone: '',
    secondaryPhone: '',
    email: '',
    nationality: 'فلسطيني',
    units: [],
    notes: '',
  });

  useEffect(() => {
    getUnits().then(setAvailableUnits);
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || '',
        idNumber: initialData.idNumber || '',
        primaryPhone: initialData.primaryPhone || '',
        secondaryPhone: initialData.secondaryPhone || '',
        email: initialData.email || '',
        nationality: initialData.nationality || 'فلسطيني',
        units: initialData.units || [],
        notes: initialData.notes || '',
      });
    }
  }, [initialData]);

  const handleAddUnit = () => {
    if (!selectedUnitId) return;
    const unitObj = availableUnits.find(u => u.id === selectedUnitId);
    if (!unitObj) return;

    if (formData.units.some(u => u.unitId === selectedUnitId)) {
      alert('هذه الشقة مضافة مسبقاً لهذا الساكن');
      return;
    }

    const category = unitObj.unitCategory || (unitObj.floor === 0 ? 'حاصل' : 'شقة');

    setFormData({
      ...formData,
      units: [
        ...formData.units,
        {
          unitId: unitObj.id,
          unitNumber: unitObj.unitNumber,
          type: unitObj.type,
          unitCategory: category,
          direction: unitObj.direction,
          occupancyDate: new Date(),
          landlordName: unitObj.leaseInfo?.landlordName || unitObj.ownerInfo?.name || '',
          landlordPhone: unitObj.leaseInfo?.landlordPhone || unitObj.ownerInfo?.phone || '',
          leaseStartDate: unitObj.leaseInfo?.startDate || '',
          leaseEndDate: unitObj.leaseInfo?.endDate || '',
          leaseDuration: unitObj.leaseInfo?.duration || '',
          floor: 0
        }
      ]
    });
    setSelectedUnitId('');
  };

  const handleRemoveUnit = (unitId: string) => {
    setFormData({
      ...formData,
      units: formData.units.filter(u => u.unitId !== unitId)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label required">الاسم الرباعي</label>
          <input
            type="text"
            className="form-input"
            placeholder="أدخل الاسم الكامل"
            value={formData.fullName}
            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label required">رقم الهوية (يُستخدم للدخول)</label>
          <input
            type="text"
            className="form-input"
            placeholder="مثال: 401234567"
            value={formData.idNumber}
            onChange={e => setFormData({ ...formData, idNumber: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label required">رقم الجوال الأساسي</label>
          <input
            type="tel"
            className="form-input"
            placeholder="059xxxxxxx"
            value={formData.primaryPhone}
            onChange={e => setFormData({ ...formData, primaryPhone: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">رقم الجوال البديل (اختياري)</label>
          <input
            type="tel"
            className="form-input"
            placeholder="056xxxxxxx"
            value={formData.secondaryPhone}
            onChange={e => setFormData({ ...formData, secondaryPhone: e.target.value })}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">الجنسية</label>
        <input
          type="text"
          className="form-input"
          value={formData.nationality}
          onChange={e => setFormData({ ...formData, nationality: e.target.value })}
        />
      </div>

      {/* Unit Association */}
      <div style={{ background: 'var(--color-gray-50)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-gray-200)' }}>
        <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>🏠 الوحدات والشقق/الحواصل المربوطة بالساكن:</label>

        {formData.units.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {formData.units.map(u => {
              const cat = u.unitCategory || (u.unitNumber.includes('حاصل') ? 'حاصل' : 'شقة');
              return (
                <span key={u.unitId} className={`badge ${cat === 'حاصل' ? 'badge-blue' : 'badge-green'}`} style={{ padding: '6px 12px', fontSize: 13 }}>
                  {cat} {u.unitNumber} ({u.type} {u.direction ? `- ${u.direction}` : ''})
                  <button
                    type="button"
                    onClick={() => handleRemoveUnit(u.unitId)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 6, color: 'var(--color-danger)' }}
                    title="حذف الربط"
                  >
                    ✕
                  </button>
                </span>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--color-gray-500)', marginBottom: 12 }}>لم يتم ربط شقة أو حاصل بعد</div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select
            className="form-select"
            value={selectedUnitId}
            onChange={e => setSelectedUnitId(e.target.value)}
            style={{ flex: '1 1 200px' }}
          >
            <option value="">اختر شقة أو حاصل لربطه...</option>
            {availableUnits.map(u => {
              const cat = u.unitCategory || (u.floor === 0 ? 'حاصل' : 'شقة');
              const floorLabel = u.floor === 0 ? 'الأرضي' : `الطابق ${u.floor}`;
              return (
                <option key={u.id} value={u.id}>
                  {cat === 'حاصل' ? '🏪 حاصل' : '🏠 شقة'} رقم {u.unitNumber} ({floorLabel} - {u.direction} - {u.status})
                </option>
              );
            })}
          </select>
          <button
            type="button"
            onClick={handleAddUnit}
            className="btn btn-secondary"
            disabled={!selectedUnitId}
            style={{ flex: '0 0 auto' }}
          >
            + ربط الوحدة
          </button>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">ملاحظات إضافية</label>
        <textarea
          className="form-textarea"
          placeholder="أي ملاحظات حول الساكن..."
          value={formData.notes}
          onChange={e => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12, flexWrap: 'wrap' }}>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: '1 1 140px' }}>
          {loading ? 'جارٍ الحفظ...' : initialData ? 'تحديث البيانات' : 'إضافة الساكن'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={loading} style={{ flex: '1 1 100px' }}>
          إلغاء
        </button>
      </div>
    </form>
  );
};

export default ResidentForm;
