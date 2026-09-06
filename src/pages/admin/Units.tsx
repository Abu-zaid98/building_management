import React, { useState, useEffect } from 'react';
import { getUnits, addUnit, updateUnit, deleteUnit } from '../../services/units';
import type { Unit, UnitFormData } from '../../types';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import UnitForm from '../../components/units/UnitForm';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiHome, FiMaximize2, FiCompass, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Units: React.FC = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('الكل');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const data = await getUnits();
      setUnits(data);
    } catch (err) {
      toast.error('حدث خطأ أثناء جلب الشقق');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleCreateOrUpdate = async (formData: UnitFormData) => {
    try {
      setActionLoading(true);
      const cat = formData.unitCategory || 'الوحدة';
      if (editingUnit) {
        await updateUnit(editingUnit.id, formData);
        toast.success(`تم تحديث بيانات ${cat} بنجاح`);
      } else {
        await addUnit(formData);
        toast.success(`تمت إضافة ${cat} بنجاح`);
      }
      setIsFormOpen(false);
      setEditingUnit(null);
      fetchUnits();
    } catch (err) {
      toast.error('تعذر حفظ البيانات، حاول مرة أخرى');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUnitId) return;
    try {
      setActionLoading(true);
      await deleteUnit(deletingUnitId);
      toast.success('تم حذف الوحدة بنجاح');
      setDeletingUnitId(null);
      fetchUnits();
    } catch (err) {
      toast.error('تعذر حذف الوحدة');
    } finally {
      setActionLoading(false);
    }
  };

  const [filterCategory, setFilterCategory] = useState<string>('الكل');

  const filteredUnits = units.filter(unit => {
    const category = unit.unitCategory || (unit.floor === 0 ? 'حاصل' : 'شقة');
    const matchesSearch = unit.unitNumber.includes(searchTerm) ||
      unit.direction.includes(searchTerm) ||
      category.includes(searchTerm) ||
      (unit.ownerInfo?.name || '').includes(searchTerm);

    const matchesStatus = filterStatus === 'الكل' || unit.status === filterStatus;
    const matchesCategory = filterCategory === 'الكل' || category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-header-title">🏢 إدارة الشقق والحواصل</h1>
          <div className="page-header-sub">إضافة، تعديل وحذف الشقق السكنية والحواصل والمحلات الأرضية وتتبع حالتها</div>
        </div>
        <button
          onClick={() => { setEditingUnit(null); setIsFormOpen(true); }}
          className="btn btn-primary"
        >
          <FiPlus size={18} /> إضافة شقة / حاصل جديد
        </button>
      </div>

      {/* Filters & Search */}
      <div className="card" style={{ marginBottom: 24, padding: 16 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="search-bar" style={{ minWidth: 260 }}>
            <input
              type="text"
              placeholder="البحث بالرقم، الاتجاه، أو النوع..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <FiSearch className="search-bar-icon" />
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Category Filter */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--color-gray-500)', fontWeight: 600 }}>النوع:</span>
              {['الكل', 'شقة', 'حاصل', 'مخزن'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`btn btn-sm ${filterCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {cat === 'الكل' ? 'الكل' : cat === 'شقة' ? '🏠 شقق' : cat === 'حاصل' ? '🏪 حواصل' : '📦 مخازن'}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--color-gray-500)', fontWeight: 600 }}>الحالة:</span>
              {['الكل', 'مأهولة', 'شاغرة'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`btn btn-sm ${filterStatus === status ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Units List */}
      {loading ? (
        <div className="loading-screen" style={{ minHeight: 250 }}>
          <div className="loading-spinner" />
          <p>جارٍ تحميل الوحدات...</p>
        </div>
      ) : filteredUnits.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <div className="empty-state-title">لا توجد وحدات مطابقة للبحث</div>
            <div className="empty-state-sub">قم بضغط "إضافة شقة / حاصل جديد" للبدء في إضافة البيانات</div>
          </div>
        </div>
      ) : (
        <div className="grid-3">
          {filteredUnits.map(unit => {
            const category = unit.unitCategory || (unit.floor === 0 ? 'حاصل' : 'شقة');
            const isStore = category === 'حاصل' || category === 'مخزن';
            return (
              <div key={unit.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div
                  style={{
                    height: 6,
                    background: unit.status === 'مأهولة' ? 'var(--color-primary)' : 'var(--color-gray-300)'
                  }}
                />
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className={`badge ${isStore ? 'badge-blue' : 'badge-green'}`} style={{ fontSize: 11 }}>
                          {isStore ? (category === 'حاصل' ? '🏪 حاصل' : '📦 مخزن') : '🏠 شقة'}
                        </span>
                        <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--color-gray-900)' }}>
                          {unit.unitNumber.includes('حاصل') || unit.unitNumber.includes('شقة') ? unit.unitNumber : `${category} ${unit.unitNumber}`}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--color-gray-500)', marginTop: 4 }}>
                        {unit.floor === 0 ? 'الطابق الأرضي (0)' : unit.floor < 0 ? `طابق التسوية (${unit.floor})` : `الطابق ${unit.floor}`}
                      </div>
                    </div>
                    <span className={`badge ${unit.status === 'مأهولة' ? 'badge-green' : 'badge-gray'}`}>
                      {unit.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '16px 0', fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-gray-600)' }}>
                      <FiCompass color="var(--color-primary)" /> الاتجاه: <strong>{unit.direction}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-gray-600)' }}>
                      <FiMaximize2 color="var(--color-primary)" /> المساحة: <strong>{unit.area} م²</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-gray-600)' }}>
                      <FiHome color="var(--color-primary)" /> نوع الإشغال: <strong className={unit.type === 'ملك' ? 'text-success' : 'text-primary'}>{unit.type === 'ملك' ? '👑 ملك (مالك أصلي)' : '📝 إيجار (عقد إيجار)'}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-gray-600)' }}>
                      <FiDollarSign color="var(--color-primary)" /> رسوم الخدمات: <strong>{unit.servicesFee} ₪ / شهرياً</strong>
                    </div>

                    {/* بيانات الملكية: إذا كانت ملك */}
                    {unit.type === 'ملك' && unit.ownerInfo?.name && (
                      <div style={{
                        marginTop: 6,
                        background: '#F0FDF4',
                        border: '1px solid #BBF7D0',
                        borderRadius: 8,
                        padding: '10px 12px',
                        fontSize: 12,
                        color: '#166534'
                      }}>
                        <div style={{ fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>👑</span> بيانات المالك:
                        </div>
                        <div>الاسم: <strong>{unit.ownerInfo.name}</strong></div>
                        <div>الجوال: <strong dir="ltr">{unit.ownerInfo.phone}</strong></div>
                        {unit.ownerInfo.idNumber && <div>الهوية: <code>{unit.ownerInfo.idNumber}</code></div>}
                      </div>
                    )}

                    {/* بيانات الإيجار: إذا كانت إيجار */}
                    {unit.type === 'إيجار' && (
                      <div style={{
                        marginTop: 6,
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        borderRadius: 8,
                        padding: '10px 12px',
                        fontSize: 12,
                        color: '#1E40AF',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6
                      }}>
                        <div style={{ fontWeight: 800, color: '#1E3A8A', borderBottom: '1px dashed #93C5FD', paddingBottom: 4 }}>
                          📝 بيانات المؤجر والمستأجر (إيجار):
                        </div>

                        {/* المؤجر */}
                        <div>
                          <strong>🏢 المؤجر (المالك):</strong> {unit.leaseInfo?.landlordName || unit.ownerInfo?.name || 'غير مسجل'} {unit.leaseInfo?.landlordPhone ? `(${unit.leaseInfo.landlordPhone})` : ''}
                        </div>

                        {/* المستأجر */}
                        <div>
                          <strong>👤 المستأجر:</strong> {unit.leaseInfo?.tenantName || 'غير مسجل'} {unit.leaseInfo?.tenantPhone ? `(${unit.leaseInfo.tenantPhone})` : ''}
                        </div>

                        {/* مدة العقد */}
                        {(unit.leaseInfo?.startDate || unit.leaseInfo?.duration) && (
                          <div style={{ background: '#DBEAFE', padding: '4px 8px', borderRadius: 6, fontSize: 11, color: '#1E3A8A' }}>
                            <strong>📅 مدة العقد:</strong> {unit.leaseInfo.duration || 'محدد'}
                            {unit.leaseInfo.startDate && unit.leaseInfo.endDate && (
                              <div style={{ marginTop: 2, color: '#2563EB' }}>
                                (من {unit.leaseInfo.startDate} إلى {unit.leaseInfo.endDate})
                              </div>
                            )}
                          </div>
                        )}

                        {unit.leaseInfo?.monthlyRent ? (
                          <div><strong>💵 قيمة الإيجار:</strong> {unit.leaseInfo.monthlyRent} ₪ / شهرياً</div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className="divider" />

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => { setEditingUnit(unit); setIsFormOpen(true); }}
                      className="btn btn-ghost btn-sm"
                      title="تعديل"
                    >
                      <FiEdit2 /> تعديل
                    </button>
                    <button
                      onClick={() => setDeletingUnitId(unit.id)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--color-danger)' }}
                      title="حذف"
                    >
                      <FiTrash2 /> حذف
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingUnit(null); }}
        title={editingUnit ? `تعديل بيانات ${editingUnit.unitCategory || 'الوحدة'}` : 'إضافة شقة / حاصل جديد'}
        size="lg"
      >
        <UnitForm
          initialData={editingUnit}
          onSubmit={handleCreateOrUpdate}
          onCancel={() => { setIsFormOpen(false); setEditingUnit(null); }}
          loading={actionLoading}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingUnitId}
        onClose={() => setDeletingUnitId(null)}
        onConfirm={handleDelete}
        title="تأكيد حذف الوحدة"
        message="هل أنت تأكد من رغبتك في حذف هذه الوحدة؟ سيتم إلغاء ربطها بالساكن إن وجد."
        loading={actionLoading}
      />
    </div>
  );
};

export default Units;
