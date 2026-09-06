import React, { useState, useEffect } from 'react';
import { getBuildingInfo, updateBuildingInfo } from '../../services/buildingInfo';
import type { BuildingInfo } from '../../types';
import { FiInfo, FiSave, FiPhone, FiMail, FiMapPin, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';

const AdminBuildingInfo: React.FC = () => {
  const [info, setInfo] = useState<BuildingInfo>({
    buildingName: 'عمارة الياسمين السكنية',
    address: 'القدس - شارع السلام',
    phone: '0599000000',
    email: 'info@building.com',
    managementCouncil: 'أحمد محمود، علي حسن، محمد سعيد',
    councilPhone: '0599111222',
    councilEmail: 'council@building.com',
    established: '2020',
    description: 'عمارة سكنية حديثة تتكون من 6 طوابق ومواقف سيارات ومصعد كهربائي.',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getBuildingInfo()
      .then(data => {
        if (data) setInfo(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateBuildingInfo(info);
      toast.success('تمت تحديث بيانات العمارة بنجاح');
    } catch (err) {
      toast.error('تعذر حفظ التغييرات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-header-title">🏢 بيانات العمارة ومجلس الإدارة</h1>
          <div className="page-header-sub">تحديث اسم العمارة، بيات الاتصال، وأسماء أعضاء مجلس الإدارة</div>
        </div>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 250 }}>
          <div className="loading-spinner" />
          <p>جارٍ تحميل بيانات العمارة...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Main Info */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">📍 البيانات الأساسية للعمارة</div>
            </div>
            <div className="card-body">
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label required">اسم العمارة</label>
                  <input
                    type="text"
                    className="form-input"
                    value={info.buildingName}
                    onChange={e => setInfo({ ...info, buildingName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">العنوان الكامل</label>
                  <input
                    type="text"
                    className="form-input"
                    value={info.address}
                    onChange={e => setInfo({ ...info, address: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid-2" style={{ marginTop: 14 }}>
                <div className="form-group">
                  <label className="form-label">رقم الهاتف الرئيسي</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={info.phone}
                    onChange={e => setInfo({ ...info, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">البريد الإلكتروني</label>
                  <input
                    type="email"
                    className="form-input"
                    value={info.email}
                    onChange={e => setInfo({ ...info, email: e.target.value })}
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid-2" style={{ marginTop: 14 }}>
                <div className="form-group">
                  <label className="form-label">سنة التأسيس</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="مثال: 2022"
                    value={info.established || ''}
                    onChange={e => setInfo({ ...info, established: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">وصف العمارة</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="وصف مختصر للعمارة..."
                    value={info.description || ''}
                    onChange={e => setInfo({ ...info, description: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Council Info */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">👥 بيانات مجلس الإدارة</div>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">أسماء أعضاء مجلس الإدارة</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="أدخل أسماء أعضاء مجلس الإدارة مقسومة بفاصلة"
                  value={info.managementCouncil}
                  onChange={e => setInfo({ ...info, managementCouncil: e.target.value })}
                />
              </div>

              <div className="grid-2" style={{ marginTop: 14 }}>
                <div className="form-group">
                  <label className="form-label">رقم جوال المجلس / الأدمن</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={info.councilPhone}
                    onChange={e => setInfo({ ...info, councilPhone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">بريد المجلس</label>
                  <input
                    type="email"
                    className="form-input"
                    value={info.councilEmail}
                    onChange={e => setInfo({ ...info, councilEmail: e.target.value })}
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
              <FiSave size={18} /> {saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminBuildingInfo;
