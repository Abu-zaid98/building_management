import React, { useState, useEffect } from 'react';
import { getSuggestions, updateSuggestionStatus, deleteSuggestion } from '../../services/suggestions';
import type { Suggestion, SuggestionStatus } from '../../types';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { FiMessageSquare, FiSearch, FiCheckCircle, FiClock, FiAlertTriangle, FiTrash2, FiCornerDownLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';

const AdminSuggestions: React.FC = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('الكل');

  // Response Modal State
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [status, setStatus] = useState<SuggestionStatus>('تم التعامل معه');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const data = await getSuggestions();
      setSuggestions(data);
    } catch (err) {
      toast.error('حدث خطأ في جلب الاقتراحات والشكاوى');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const handleOpenResponse = (s: Suggestion) => {
    setSelectedSuggestion(s);
    setAdminNotes(s.adminNotes || '');
    setStatus(s.status === 'جديد' ? 'تم التعامل معه' : s.status);
  };

  const handleSaveResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSuggestion) return;
    try {
      setActionLoading(true);
      await updateSuggestionStatus(selectedSuggestion.id, status, adminNotes);
      toast.success('تم تحديث حالة الطلب وإضافة الملاحظات بنجاح');
      setSelectedSuggestion(null);
      fetchSuggestions();
    } catch (err) {
      toast.error('تعذر حفظ الملاحظات');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      setActionLoading(true);
      await deleteSuggestion(deletingId);
      toast.success('تم حذف الطلب');
      setDeletingId(null);
      fetchSuggestions();
    } catch (err) {
      toast.error('تعذر الحذف');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = suggestions.filter(s => {
    const matchesSearch = s.title.includes(searchTerm) ||
      s.description.includes(searchTerm) ||
      s.residentName?.includes(searchTerm) ||
      s.unitNumber?.includes(searchTerm);
    const matchesStatus = filterStatus === 'الكل' || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-header-title">💬 صندوق الاقتراحات والشكاوى</h1>
          <div className="page-header-sub">إدارة وتصفح الشكاوى والاقتراحات المقدمة من السكان والرد عليها</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 24, padding: 16 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar">
            <input
              type="text"
              placeholder="البحث بالعنوان، الوصف، اسم الساكن أو رقم الشقة..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <FiSearch className="search-bar-icon" />
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--color-gray-500)', fontWeight: 600 }}>الحالة:</span>
            {['الكل', 'جديد', 'مقروء', 'تم التعامل معه'].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`btn btn-sm ${filterStatus === st ? 'btn-primary' : 'btn-ghost'}`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 250 }}>
          <div className="loading-spinner" />
          <p>جارٍ التحميل...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <div className="empty-state-title">لا توجد طلبات هنا</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(s => (
            <div key={s.id} className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`badge ${s.type === 'شكوى' ? 'badge-red' : 'badge-blue'}`}>{s.type}</span>
                  <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--color-gray-900)' }}>{s.title}</div>
                  <span style={{ fontSize: 13, color: 'var(--color-gray-500)' }}>
                    ({s.unitNumber?.includes('حاصل') || s.unitNumber?.includes('شقة') ? s.unitNumber : `وحدة ${s.unitNumber}`} - {s.residentName})
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={`badge ${s.status === 'تم التعامل معه' ? 'badge-green' : s.status === 'مقروء' ? 'badge-blue' : 'badge-yellow'}`}>
                    {s.status}
                  </span>
                  <button onClick={() => setDeletingId(s.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }}>
                    <FiTrash2 />
                  </button>
                </div>
              </div>

              <div className="card-body">
                <p style={{ color: 'var(--color-gray-700)', fontSize: 14, lineHeight: 1.6 }}>{s.description}</p>

                {s.adminNotes && (
                  <div style={{ marginTop: 12, padding: 12, background: 'var(--color-primary-50)', borderRadius: 8, fontSize: 13 }}>
                    <strong style={{ color: 'var(--color-primary-dark)' }}>رد الأدمن:</strong> {s.adminNotes}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-gray-400)' }}>
                    تاريخ التقديم: {s.createdAt.toLocaleDateString('ar-EG')}
                  </span>
                  <button onClick={() => handleOpenResponse(s)} className="btn btn-secondary btn-sm">
                    <FiCornerDownLeft /> {s.adminNotes ? 'تعديل الرد' : 'الرد على الطلب'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Response Modal */}
      <Modal isOpen={!!selectedSuggestion} onClose={() => setSelectedSuggestion(null)} title="الرد وتغيير حالة الطلب">
        <form onSubmit={handleSaveResponse} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label required">حالة الطلب</label>
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value as SuggestionStatus)}>
              <option value="جديد">جديد</option>
              <option value="مقروء">مقروء</option>
              <option value="تم التعامل معه">تم التعامل معه</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">ملاحظات / رد الأدمن</label>
            <textarea
              className="form-textarea"
              placeholder="اكتب الرد الذي سيظهر للساكن..."
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={actionLoading}>
              {actionLoading ? 'جارٍ الحفظ...' : 'حفظ الرد'}
            </button>
            <button type="button" onClick={() => setSelectedSuggestion(null)} className="btn btn-secondary">
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="حذف الطلب"
        message="هل أنت تأكد من رغبتك في حذف هذا الطلب؟"
        loading={actionLoading}
      />
    </div>
  );
};

export default AdminSuggestions;
