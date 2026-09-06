import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { changePassword } from '../../services/auth';
import { auth } from '../../services/firebase';
import { FiSettings, FiLock, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
      toast.success('تم تحديث كلمة المرور بنجاح');
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
          <h1 className="page-header-title">⚙️ الإعدادات العامة والأمان</h1>
          <div className="page-header-sub">تحديث أمان الحساب وإعدادات النظام</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Profile Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🛡️ حساب الأدمن الحالي</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--color-gray-500)' }}>الاسم</label>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-gray-900)' }}>
                  {user?.displayName || 'مجلس الإدارة'}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--color-gray-500)' }}>البريد الإلكتروني</label>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-gray-700)' }}>
                  {user?.email}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--color-gray-500)' }}>الصلاحيات</label>
                <span className="badge badge-green">مدير النظام (أدمن)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🔐 تغيير كلمة المرور للأدمن</div>
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

      {/* System Documentation & Credits */}
      <div className="card" style={{ marginTop: 24, background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)', border: '1.5px solid var(--color-primary-200)' }}>
        <div className="card-header" style={{ background: 'transparent' }}>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-primary-dark)' }}>
            <span>📜 توثيق ومعلومات النظام</span>
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--color-gray-500)' }}>تم تصميم وبرمجة وتطوير النظام بواسطة:</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-gray-900)', marginTop: 4 }}>
                المهندس / mohammed Suhile EJoujo
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                م. محمد سهيل الجوجو
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="badge badge-blue" style={{ padding: '6px 12px', fontSize: 12 }}>
                الإصدار 2.0.0
              </span>
              <span className="badge badge-green" style={{ padding: '6px 12px', fontSize: 12 }}>
                نظام إدارة العمارات السكنية
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
