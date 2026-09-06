import React, { useState, useEffect } from 'react';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../services/announcements';
import { getResidents } from '../../services/residents';
import { useAuth } from '../../contexts/AuthContext';
import type { Announcement, AnnouncementAudience, AnnouncementPriority, Resident } from '../../types';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { FiPlus, FiBell, FiEdit2, FiTrash2, FiCalendar, FiUsers, FiUserCheck, FiSearch, FiCheckSquare, FiSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';

const AdminAnnouncements: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<AnnouncementPriority>('عادي');
  const [targetAudience, setTargetAudience] = useState<AnnouncementAudience>('الكل');
  const [selectedResidentIds, setSelectedResidentIds] = useState<string[]>([]);
  const [residentSearchTerm, setResidentSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [annData, resData] = await Promise.all([
        getAnnouncements(),
        getResidents()
      ]);
      setAnnouncements(annData);
      setResidents(resData);
    } catch (err) {
      toast.error('حدث خطأ في جلب بيانات الإعلانات والسكان');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenForm = (item?: Announcement) => {
    if (item) {
      setEditingItem(item);
      setTitle(item.title);
      setContent(item.content);
      setPriority(item.priority);
      setTargetAudience(item.targetAudience || 'الكل');
      setSelectedResidentIds(item.targetResidentIds || []);
    } else {
      setEditingItem(null);
      setTitle('');
      setContent('');
      setPriority('عادي');
      setTargetAudience('الكل');
      setSelectedResidentIds([]);
    }
    setResidentSearchTerm('');
    setIsFormOpen(true);
  };

  const handleToggleResident = (residentId: string) => {
    setSelectedResidentIds(prev =>
      prev.includes(residentId)
        ? prev.filter(id => id !== residentId)
        : [...prev, residentId]
    );
  };

  const handleSelectAllResidents = () => {
    setSelectedResidentIds(residents.map(r => r.id));
  };

  const handleDeselectAllResidents = () => {
    setSelectedResidentIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (targetAudience === 'محدد' && selectedResidentIds.length === 0) {
      toast.error('يرجى تحديد ساكن واحد على الأقل، أو اختيار "جميع السكان"');
      return;
    }

    try {
      setActionLoading(true);

      const targetResidentNames = targetAudience === 'محدد'
        ? residents.filter(r => selectedResidentIds.includes(r.id)).map(r => r.fullName)
        : [];

      const payload = {
        title,
        content,
        priority,
        targetAudience,
        targetResidentIds: targetAudience === 'محدد' ? selectedResidentIds : [],
        targetResidentNames,
      };

      if (editingItem) {
        await updateAnnouncement(editingItem.id, payload);
        toast.success('تم تحديث الإعلان بنجاح');
      } else {
        await createAnnouncement(payload, user?.uid || '');
        toast.success('تم نشر الإعلان بنجاح');
      }
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      toast.error('تعذر حفظ الإعلان');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      setActionLoading(true);
      await deleteAnnouncement(deletingId);
      toast.success('تم حذف الإعلان');
      setDeletingId(null);
      fetchData();
    } catch (err) {
      toast.error('تعذر حذف الإعلان');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredResidentsForForm = residents.filter(r =>
    r.fullName.includes(residentSearchTerm) ||
    r.idNumber.includes(residentSearchTerm) ||
    r.units.some(u => u.unitNumber.includes(residentSearchTerm))
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-header-title">📢 الإعلانات والقرارات</h1>
          <div className="page-header-sub">نشر التنبيهات والقرارات الهامة لجميع السكان أو لسكان محددين</div>
        </div>
        <button onClick={() => handleOpenForm()} className="btn btn-primary">
          <FiPlus size={18} /> نشر إعلان جديد
        </button>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 250 }}>
          <div className="loading-spinner" />
          <p>جارٍ التحميل...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📢</div>
            <div className="empty-state-title">لا توجد إعلانات منشورة</div>
            <div className="empty-state-sub">اضغط "نشر إعلان جديد" لإضافة أول تنبيه للسكان</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {announcements.map(item => {
            const isSpecific = item.targetAudience === 'محدد';
            const count = item.targetResidentIds?.length || 0;

            return (
              <div key={item.id} className="card">
                <div className="card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <FiBell color="var(--color-primary)" size={20} />
                    <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--color-gray-900)' }}>
                      {item.title}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className={`badge ${item.priority === 'عاجل' ? 'badge-red' : item.priority === 'مهم' ? 'badge-yellow' : 'badge-blue'}`}>
                      {item.priority}
                    </span>
                    {isSpecific ? (
                      <span className="badge badge-purple" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FiUserCheck size={13} /> موجه لـ ({count}) سكان
                      </span>
                    ) : (
                      <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FiUsers size={13} /> موجه لجميع السكان
                      </span>
                    )}
                    <button onClick={() => handleOpenForm(item)} className="btn btn-ghost btn-sm" title="تعديل">
                      <FiEdit2 />
                    </button>
                    <button onClick={() => setDeletingId(item.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} title="حذف">
                      <FiTrash2 />
                    </button>
                  </div>
                </div>

                <div className="card-body">
                  <p style={{ color: 'var(--color-gray-700)', fontSize: 15, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                    {item.content}
                  </p>

                  {isSpecific && item.targetResidentNames && item.targetResidentNames.length > 0 && (
                    <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-gray-200)', fontSize: 12 }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-gray-700)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiUsers /> السكان المستهدفون بهذا الإعلان:
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {item.targetResidentNames.map((name, idx) => (
                          <span key={idx} className="badge badge-gray" style={{ fontSize: 11, padding: '3px 8px' }}>
                            👤 {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-gray-400)', marginTop: 14 }}>
                    <FiCalendar /> تاريخ النشر: {item.createdAt.toLocaleDateString('ar-EG')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingItem ? 'تعديل الإعلان' : 'نشر إعلان جديد'} size="lg">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label required">أهمية الإعلان</label>
              <select className="form-select" value={priority} onChange={e => setPriority(e.target.value as AnnouncementPriority)}>
                <option value="عادي">عادي</option>
                <option value="مهم">مهم</option>
                <option value="عاجل">عاجل / تنبيه هام</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label required">الجمهور المستهدف بالإعلان</label>
              <select
                className="form-select"
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value as AnnouncementAudience)}
              >
                <option value="الكل">🌐 جميع سكان العمارة (عام)</option>
                <option value="محدد">🎯 سكان مخصصون فقط (تحديد يدوي)</option>
              </select>
            </div>
          </div>

          {/* Targeted Residents Selector Box */}
          {targetAudience === 'محدد' && (
            <div style={{
              background: 'var(--color-gray-50)',
              border: '1.5px solid var(--color-primary-light, #93c5fd)',
              borderRadius: 'var(--radius-lg)',
              padding: 16
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <label className="form-label" style={{ margin: 0, fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                    👥 اختر السكان المستهدفين ({selectedResidentIds.length} محدد):
                  </label>
                  <div style={{ fontSize: 12, color: 'var(--color-gray-500)' }}>
                    سيظهر هذا الإعلان فقط للسكان الذين يتم اختيارهم من هذه القائمة
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleSelectAllResidents}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 12, padding: '4px 8px' }}
                  >
                    <FiCheckSquare /> تحديد الكل
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAllResidents}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 12, padding: '4px 8px' }}
                  >
                    <FiSquare /> إلغاء التحديد
                  </button>
                </div>
              </div>

              {/* Search filter inside modal */}
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="بحث عن ساكن بالاسم أو رقم الشقة أو الهوية..."
                  value={residentSearchTerm}
                  onChange={e => setResidentSearchTerm(e.target.value)}
                  style={{ fontSize: 13, paddingRight: 34 }}
                />
                <FiSearch style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }} />
              </div>

              {/* Residents Checklist */}
              <div style={{
                maxHeight: 190,
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 8,
                background: '#ffffff',
                padding: 10,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-gray-200)'
              }}>
                {filteredResidentsForForm.length === 0 ? (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 16, color: 'var(--color-gray-500)', fontSize: 13 }}>
                    لم يتم العثور على سكان مطابقين للبحث
                  </div>
                ) : (
                  filteredResidentsForForm.map(r => {
                    const isChecked = selectedResidentIds.includes(r.id);
                    const unitsLabel = r.units.map(u => `${u.unitCategory || 'شقة'} ${u.unitNumber}`).join(', ') || 'بدون شقة';

                    return (
                      <label
                        key={r.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-sm)',
                          border: `1.5px solid ${isChecked ? 'var(--color-primary)' : 'var(--color-gray-200)'}`,
                          background: isChecked ? 'var(--color-primary-50, #eff6ff)' : '#fff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleResident(r.id)}
                          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-gray-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {r.fullName}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--color-gray-500)' }}>
                            🏠 {unitsLabel}
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label required">عنوان الإعلان</label>
            <input
              type="text"
              className="form-input"
              placeholder="مثال: تنبيه بخصوص انقطاع المياه يوم الثلاثاء"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">نص الإعلان</label>
            <textarea
              className="form-textarea"
              placeholder="نص القرار أو الإعلان الموجه للسكان..."
              value={content}
              onChange={e => setContent(e.target.value)}
              required
              rows={4}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={actionLoading}>
              {actionLoading ? 'جارٍ النشر...' : editingItem ? 'تحديث الإعلان' : 'نشر الإعلان'}
            </button>
            <button type="button" onClick={() => setIsFormOpen(false)} className="btn btn-secondary">
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="حذف الإعلان"
        message="هل أنت تأكد من رغبتك في حذف هذا الإعلان؟"
        loading={actionLoading}
      />
    </div>
  );
};

export default AdminAnnouncements;
