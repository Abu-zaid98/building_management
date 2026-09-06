import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getSuggestionsByResident, submitSuggestion } from '../../services/suggestions';
import { getResidents } from '../../services/residents';
import type { Suggestion, SuggestionType, SuggestionPriority } from '../../types';
import Modal from '../../components/ui/Modal';
import { FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ResidentSuggestion: React.FC = () => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [type, setType] = useState<SuggestionType>('اقتراح');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<SuggestionPriority>('عادي');

  const [residentData, setResidentData] = useState<any>(null);
  const [selectedUnitNumber, setSelectedUnitNumber] = useState('');

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const allResidents = await getResidents();
      const resident = allResidents.find(r => r.email === user?.email);

      if (resident) {
        setResidentData(resident);
        if (resident.units && resident.units.length > 0) {
          const first = resident.units[0];
          const cat = first.unitCategory || (first.floor === 0 ? 'حاصل' : 'شقة');
          setSelectedUnitNumber(first.unitNumber.includes('حاصل') || first.unitNumber.includes('شقة') ? first.unitNumber : `${cat} ${first.unitNumber}`);
        }
        const resSuggestions = await getSuggestionsByResident(resident.id);
        setSuggestions(resSuggestions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const allResidents = await getResidents();
      const resident = allResidents.find(r => r.email === user?.email);

      if (!resident) {
        toast.error('لم يتم العثور على بيانات الساكن');
        return;
      }

      const unit = resident.units?.find(u => {
        const cat = u.unitCategory || (u.floor === 0 ? 'حاصل' : 'شقة');
        const formatted = u.unitNumber.includes('حاصل') || u.unitNumber.includes('شقة') ? u.unitNumber : `${cat} ${u.unitNumber}`;
        return formatted === selectedUnitNumber || u.unitNumber === selectedUnitNumber;
      }) || resident.units?.[0];

      const cat = unit?.unitCategory || (unit?.floor === 0 ? 'حاصل' : 'شقة');
      const finalUnitNum = unit ? (unit.unitNumber.includes('حاصل') || unit.unitNumber.includes('شقة') ? unit.unitNumber : `${cat} ${unit.unitNumber}`) : '';

      await submitSuggestion(
        {
          type, title, description, priority,
          unitId: unit?.unitId || '',
          residentId: resident.id
        },
        resident.id,
        resident.fullName,
        unit?.unitId || '',
        finalUnitNum
      );

      toast.success('تم تقديم الطلب بنجاح ومشاركته مع مجلس الإدارة');
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      fetchSuggestions();
    } catch (err) {
      toast.error('تعذر تقديم الطلب');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-header-title">💬 صندوق الاقتراحات والشكاوى</h1>
          <div className="page-header-sub">تقديم الملاحظات والشكاوى لمجلس الإدارة ومتابعة ردودهم</div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <FiPlus size={18} /> تقديم طلب جديد
        </button>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 250 }}>
          <div className="loading-spinner" />
          <p>جارٍ تحميل الطلبات...</p>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <div className="empty-state-title">لا توجد اقتراحات أو شكاوى سابقة</div>
            <div className="empty-state-sub">تواصل مع مجلس الإدارة بخصوص أي ملاحظات أو شكاوى أو اقتراحات</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {suggestions.map(item => (
            <div key={item.id} className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`badge ${item.type === 'شكوى' ? 'badge-red' : 'badge-blue'}`}>
                    {item.type}
                  </span>
                  <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--color-gray-900)' }}>
                    {item.title}
                  </div>
                </div>
                <span className={`badge ${item.status === 'تم التعامل معه' ? 'badge-green' : 'badge-yellow'}`}>
                  {item.status}
                </span>
              </div>

              <div className="card-body">
                <p style={{ color: 'var(--color-gray-700)', fontSize: 14, lineHeight: 1.6 }}>
                  {item.description}
                </p>

                {item.adminNotes && (
                  <div style={{
                    marginTop: 14,
                    padding: 12,
                    background: 'var(--color-primary-50)',
                    borderRight: '3px solid var(--color-primary)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 13
                  }}>
                    <strong style={{ color: 'var(--color-primary-dark)' }}>💬 رد مجلس الإدارة:</strong>
                    <div style={{ marginTop: 4, color: 'var(--color-gray-800)' }}>{item.adminNotes}</div>
                  </div>
                )}

                <div style={{ fontSize: 12, color: 'var(--color-gray-400)', marginTop: 12 }}>
                  تم التقديم بتاريخ: {item.createdAt.toLocaleDateString('ar-EG')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="تقديم اقتراح أو شكوى">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Unit selection if multiple units */}
          {residentData?.units && residentData.units.length > 0 && (
            <div className="form-group">
              <label className="form-label required">الوحدة المعنية (شقة / حاصل)</label>
              <select
                className="form-select"
                value={selectedUnitNumber}
                onChange={e => setSelectedUnitNumber(e.target.value)}
              >
                {residentData.units.map((u: any, idx: number) => {
                  const cat = u.unitCategory || (u.floor === 0 ? 'حاصل' : 'شقة');
                  const label = u.unitNumber.includes('حاصل') || u.unitNumber.includes('شقة') ? u.unitNumber : `${cat} رقم ${u.unitNumber}`;
                  return (
                    <option key={idx} value={label}>
                      {cat === 'حاصل' ? '🏪 حاصل' : '🏠 شقة'} {u.unitNumber} ({u.type})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label required">النوع</label>
              <select
                className="form-select"
                value={type}
                onChange={e => setType(e.target.value as SuggestionType)}
              >
                <option value="اقتراح">اقتراح تحسين</option>
                <option value="شكوى">شكوى</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label required">الأهمية</label>
              <select
                className="form-select"
                value={priority}
                onChange={e => setPriority(e.target.value as SuggestionPriority)}
              >
                <option value="عادي">عادي</option>
                <option value="مهم">مهم</option>
                <option value="حرج">حرج / عاجل</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label required">عنوان الموضوع</label>
            <input
              type="text"
              className="form-input"
              placeholder="ملخص المشكلة أو الاقتراح"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">الوصف التفصيلي</label>
            <textarea
              className="form-textarea"
              placeholder="اكتب كافة التفاصيل لكي يتمكن مجلس الإدارة من متابعتها..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={actionLoading}>
              {actionLoading ? 'جارٍ الإرسال...' : 'إرسال الطلب'}
            </button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              إلغاء
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ResidentSuggestion;
