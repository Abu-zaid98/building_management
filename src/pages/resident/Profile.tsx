import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { changePassword } from '../../services/auth';
import { getResidents } from '../../services/residents';
import { getUnits } from '../../services/units';
import { useBuildingInfo } from '../../services/buildingInfo';
import type { Resident, Unit } from '../../types';
import { auth } from '../../services/firebase';
import { FiUser, FiLock, FiCheckCircle, FiHome, FiCompass, FiPhone } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ResidentProfile: React.FC = () => {
  const { user } = useAuth();
  const { buildingInfo } = useBuildingInfo();
  const [resident, setResident] = useState<Resident | null>(null);
  const [residentUnits, setResidentUnits] = useState<Unit[]>([]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchResident = async () => {
      try {
        const [allResidents, allUnits] = await Promise.all([getResidents(), getUnits()]);
        const currentRes = allResidents.find(r => r.email === user?.email || r.idNumber === user?.displayName);
        if (currentRes) {
          setResident(currentRes);
          const matched = allUnits.filter(u => currentRes.units.some(ru => ru.unitId === u.id));
          setResidentUnits(matched);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchResident();
  }, [user]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن لا تقل عن 6 أحرف');
      return;
    }

    if (!auth.currentUser) return;

    try {
      setLoading(true);
      await changePassword(auth.currentUser, currentPassword, newPassword);
      toast.success('تم تغيير كلمة المرور بنجاح');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error('تعذر تغيير كلمة المرور، تأكد من كلمة المرور الحالية');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-header-title">👤 ملفي الشخصي</h1>
          <div className="page-header-sub">عرض بيانات الحساب وتحديث كلمة المرور</div>
        </div>
      </div>

      <div className="grid-2">
        {/* User Info Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">📋 بيانات الحساب</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--color-gray-500)', display: 'block' }}>العمارة</label>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-primary-dark)' }}>
                  🏢 {buildingInfo?.buildingName || 'عمارة السكن'}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--color-gray-500)', display: 'block' }}>الاسم الرباعي</label>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-gray-900)' }}>
                  {resident?.fullName || user?.displayName || 'الساكن'}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--color-gray-500)', display: 'block' }}>رقم الهوية</label>
                <code style={{ fontSize: 13, color: 'var(--color-gray-800)', fontWeight: 700 }}>
                  {resident?.idNumber || '—'}
                </code>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--color-gray-500)', display: 'block' }}>رقم الجوال</label>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-gray-800)' }} dir="ltr">
                  {resident?.primaryPhone || '—'}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--color-gray-500)', display: 'block', marginBottom: 4 }}>الوحدات المربوطة والاتجاه</label>
                {residentUnits.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {residentUnits.map(u => {
                      const category = u.unitCategory || (u.floor === 0 ? 'حاصل' : 'شقة');
                      return (
                        <span key={u.id} className={`badge ${category === 'حاصل' ? 'badge-blue' : 'badge-green'}`} style={{ fontSize: 12, padding: '4px 10px' }}>
                          {category === 'حاصل' ? '🏪 حاصل' : '🏠 شقة'} {u.unitNumber} ({u.direction} - {u.type})
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <span className="badge badge-gray">غير مربوط بأي وحدة</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🔐 تغيير كلمة المرور</div>
          </div>
          <div className="card-body">
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label required">كلمة المرور الحالية</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label required">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label className="form-label required">تأكيد كلمة المرور الجديدة</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? 'جارٍ التحديث...' : 'تحديث كلمة المرور'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResidentProfile;
