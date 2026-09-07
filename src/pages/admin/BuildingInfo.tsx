import React, { useState, useEffect } from 'react';
import { getBuildingInfo, updateBuildingInfo } from '../../services/buildingInfo';
import type { BuildingInfo, CouncilMember } from '../../types';
import { FiSave, FiPlus, FiTrash2, FiUser, FiPhone, FiMail, FiBriefcase } from 'react-icons/fi';
import toast from 'react-hot-toast';

const EMPTY_MEMBER: CouncilMember = { name: '', role: 'عضو', phone: '', email: '' };

const ROLE_OPTIONS = ['رئيس مجلس الإدارة', 'نائب الرئيس', 'أمين السر', 'أمين الصندوق', 'عضو'];

const AdminBuildingInfo: React.FC = () => {
  const [info, setInfo] = useState<BuildingInfo>({
    buildingName: 'عمارة الياسمين السكنية',
    address: 'القدس - شارع السلام',
    phone: '0599000000',
    email: 'info@building.com',
    managementCouncil: '',
    councilPhone: '',
    councilEmail: '',
    councilMembers: [],
    established: '2020',
    description: 'عمارة سكنية حديثة تتكون من 6 طوابق ومواقف سيارات ومصعد كهربائي.',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getBuildingInfo()
      .then(data => {
        if (data) setInfo({ ...data, councilMembers: data.councilMembers || [] });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ========== Council Members Helpers ==========
  const members: CouncilMember[] = info.councilMembers || [];

  const handleMemberChange = (idx: number, field: keyof CouncilMember, value: string) => {
    const updated = members.map((m, i) => i === idx ? { ...m, [field]: value } : m);
    setInfo({ ...info, councilMembers: updated });
  };

  const handleAddMember = () => {
    setInfo({ ...info, councilMembers: [...members, { ...EMPTY_MEMBER }] });
  };

  const handleRemoveMember = (idx: number) => {
    setInfo({ ...info, councilMembers: members.filter((_, i) => i !== idx) });
  };


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


          {/* Council Members */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">👥 أعضاء مجلس الإدارة</div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleAddMember}
              >
                <FiPlus size={15} /> إضافة عضو
              </button>
            </div>
            <div className="card-body">
              {members.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '28px 0',
                    color: 'var(--color-gray-400)',
                    fontSize: 14,
                    border: '2px dashed var(--color-gray-200)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 8 }}>👥</div>
                  <div>لم يتم إضافة أعضاء مجلس الإدارة بعد</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    اضغط "إضافة عضو" لإدراج بيانات أعضاء المجلس
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {members.map((member, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'var(--color-gray-50)',
                        border: '1.5px solid var(--color-gray-200)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                      }}
                    >
                      {/* Member header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            style={{
                              width: 34, height: 34, borderRadius: '50%',
                              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                              color: '#fff', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', fontWeight: 800, fontSize: 14,
                              flexShrink: 0,
                            }}
                          >
                            {idx + 1}
                          </div>
                          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-gray-800)' }}>
                            {member.name || `العضو رقم ${idx + 1}`}
                          </span>
                          {member.role && (
                            <span className="badge badge-blue" style={{ fontSize: 11, padding: '3px 8px' }}>
                              {member.role}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(idx)}
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-danger)', padding: '6px 8px' }}
                          title="حذف العضو"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>

                      {/* Member fields */}
                      <div className="grid-2" style={{ gap: 12 }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FiUser size={12} /> الاسم الكامل
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="اسم العضو"
                            value={member.name}
                            onChange={e => handleMemberChange(idx, 'name', e.target.value)}
                          />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FiBriefcase size={12} /> المنصب / الدور
                          </label>
                          <select
                            className="form-select"
                            value={member.role}
                            onChange={e => handleMemberChange(idx, 'role', e.target.value)}
                          >
                            {ROLE_OPTIONS.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FiPhone size={12} /> رقم الجوال
                          </label>
                          <input
                            type="tel"
                            className="form-input"
                            placeholder="059xxxxxxx"
                            value={member.phone}
                            onChange={e => handleMemberChange(idx, 'phone', e.target.value)}
                          />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FiMail size={12} /> البريد الإلكتروني (اختياري)
                          </label>
                          <input
                            type="email"
                            className="form-input"
                            placeholder="email@example.com"
                            value={member.email || ''}
                            onChange={e => handleMemberChange(idx, 'email', e.target.value)}
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleAddMember}
                    style={{
                      border: '2px dashed var(--color-gray-300)',
                      justifyContent: 'center',
                      padding: 14,
                      color: 'var(--color-gray-500)',
                    }}
                  >
                    <FiPlus size={16} /> إضافة عضو آخر
                  </button>
                </div>
              )}
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
