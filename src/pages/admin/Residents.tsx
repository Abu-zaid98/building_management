import React, { useState, useEffect } from 'react';
import { getResidents, addResident, updateResident, deleteResident } from '../../services/residents';
import { getUnits } from '../../services/units';
import { resetResidentPasswordViaSecondaryApp } from '../../services/auth';
import type { Resident, ResidentFormData, Unit } from '../../types';
import { exportResidentsToExcel } from '../../utils/exportExcel';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ResidentForm from '../../components/residents/ResidentForm';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiPhone, FiCreditCard, FiHome, FiDownload, FiKey } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Residents: React.FC = () => {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [deletingResident, setDeletingResident] = useState<Resident | null>(null);
  const [resetPasswordResident, setResetPasswordResident] = useState<Resident | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const fetchResidentsAndUnits = async () => {
    try {
      setLoading(true);
      const [resData, unitsData] = await Promise.all([getResidents(), getUnits()]);
      setResidents(resData);
      setUnits(unitsData);
    } catch (err) {
      toast.error('حدث خطأ أثناء جلب قائمة السكان');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResidentsAndUnits();
  }, []);

  const handleCreateOrUpdate = async (formData: ResidentFormData) => {
    try {
      setActionLoading(true);
      if (editingResident) {
        await updateResident(editingResident.id, formData);
        toast.success('تم تحديث بيانات الساكن بنجاح');
      } else {
        await addResident(formData);
        toast.success('تمت إضافة الساكن وحساب الدخول الخاص به بنجاح');
      }
      setIsFormOpen(false);
      setEditingResident(null);
      fetchResidentsAndUnits();
    } catch (err) {
      toast.error('تعذر حفظ البيانات');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingResident) return;
    try {
      setActionLoading(true);
      const unitIds = deletingResident.units.map(u => u.unitId);
      await deleteResident(deletingResident.id, unitIds);
      toast.success('تم حذف الساكن بنجاح');
      setDeletingResident(null);
      fetchResidentsAndUnits();
    } catch (err) {
      toast.error('تعذر حذف الساكن');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordResident) return;
    try {
      setResetLoading(true);
      await resetResidentPasswordViaSecondaryApp(resetPasswordResident.idNumber);
      toast.success(`تم إعادة تعيين كلمة مرور "${resetPasswordResident.fullName}" إلى الافتراضية ✅`);
      setResetPasswordResident(null);
    } catch (err: any) {
      if (err?.message?.includes('wrong-password') || err?.code === 'auth/wrong-password') {
        toast.error('كلمة المرور الحالية لهذا الحساب غير معروفة، يرجى التواصل مع الدعم الفني لإعادة التعيين عبر لوحة Firebase');
      } else {
        toast.error('تعذر إعادة تعيين كلمة المرور');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleExportExcel = () => {
    try {
      if (residents.length === 0) {
        toast.error('لا توجد بيانات سكان لتصديرها');
        return;
      }
      exportResidentsToExcel(residents, units);
      toast.success('تم تصدير ملف الإكسل بنجاح 📊');
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء تصدير ملف الإكسل');
    }
  };

  const filteredResidents = residents.filter(r =>
    r.fullName.includes(searchTerm) ||
    r.idNumber.includes(searchTerm) ||
    r.primaryPhone.includes(searchTerm)
  );

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-header-title">👥 إدارة السكان</h1>
          <div className="page-header-sub">إضافة السكان، ربط الشقق وإنشاء حسابات الدخول تلقائياً</div>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={handleExportExcel} className="btn btn-secondary">
            <FiDownload size={18} /> تصدير إكسل (Excel)
          </button>
          <button
            onClick={() => { setEditingResident(null); setIsFormOpen(true); }}
            className="btn btn-primary"
          >
            <FiPlus size={18} /> إضافة ساكن جديد
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: 24, padding: 16 }}>
        <div className="search-bar" style={{ maxWidth: 400 }}>
          <input
            type="text"
            placeholder="البحث بالاسم، رقم الهوية، أو الهاتف..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <FiSearch className="search-bar-icon" />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-screen" style={{ minHeight: 250 }}>
          <div className="loading-spinner" />
          <p>جارٍ تحميل بيانات السكان...</p>
        </div>
      ) : filteredResidents.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">لا يوجد سكان مسجلون</div>
            <div className="empty-state-sub">قم بإضافة ساكن جديد لربطه بالشقق أو الحواصل وإتاحة الدخول له</div>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Cards View (Visible on screens <= 768px) */}
          <div className="show-on-mobile">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {filteredResidents.map(resident => (
                <div key={resident.id} className="card" style={{ padding: 16 }}>
                  {/* Card Top: Avatar, Name, Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        className="sidebar-user-avatar"
                        style={{
                          width: 40,
                          height: 40,
                          fontSize: 16,
                          background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                          color: '#fff',
                          fontWeight: 700,
                        }}
                      >
                        {resident.fullName[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--color-gray-900)' }}>
                          {resident.fullName}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-gray-500)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <FiCreditCard size={12} /> {resident.idNumber}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => { setEditingResident(resident); setIsFormOpen(true); }}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px 8px' }}
                        title="تعديل"
                        aria-label="تعديل"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        onClick={() => setResetPasswordResident(resident)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--color-warning, #f59e0b)', padding: '6px 8px' }}
                        title="إعادة تعيين كلمة المرور"
                        aria-label="إعادة تعيين كلمة المرور"
                      >
                        <FiKey size={16} />
                      </button>
                      <button
                        onClick={() => setDeletingResident(resident)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--color-danger)', padding: '6px 8px' }}
                        title="حذف"
                        aria-label="حذف"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Card Middle: Units & Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--color-gray-50)', padding: 12, borderRadius: 'var(--radius-md)', fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-gray-500)' }}>الهاتف:</span>
                      <a
                        href={`tel:${resident.primaryPhone}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: 'var(--color-primary-dark)', textDecoration: 'none' }}
                      >
                        <FiPhone size={14} /> {resident.primaryPhone}
                      </a>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                      <span style={{ color: 'var(--color-gray-500)' }}>الوحدات المربوطة:</span>
                      {resident.units.length > 0 ? (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {resident.units.map(u => {
                            const unitMatch = units.find(unitItem => unitItem.id === u.unitId);
                            const category = u.unitCategory || unitMatch?.unitCategory || (unitMatch?.floor === 0 ? 'حاصل' : 'شقة');
                            const dir = u.direction || unitMatch?.direction;
                            const isRent = u.type === 'إيجار' || unitMatch?.type === 'إيجار';
                            return (
                              <span
                                key={u.unitId}
                                className={`badge ${category === 'حاصل' ? 'badge-blue' : 'badge-green'}`}
                                style={{ fontSize: 11, padding: '3px 8px' }}
                                title={isRent ? `مستأجر - المؤجر: ${u.landlordName || unitMatch?.leaseInfo?.landlordName || 'مسجل'}` : 'مالك أصلي'}
                              >
                                {category === 'حاصل' ? '🏪 حاصل' : '🏠 شقة'} {u.unitNumber} {dir ? `(${dir})` : ''} - {isRent ? '📝 إيجار' : 'ملك'}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="badge badge-gray" style={{ fontSize: 11 }}>غير مربوط</span>
                      )}
                    </div>


                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Table View (Visible on screens > 768px) */}
          <div className="hide-on-mobile table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>الاسم الرباعي</th>
                  <th>رقم الهوية</th>
                  <th>رقم الهاتف</th>
                  <th>الشقق / الحواصل المربوطة والإشغال</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredResidents.map(resident => (
                  <tr key={resident.id}>
                    <td style={{ fontWeight: 700, color: 'var(--color-gray-900)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="sidebar-user-avatar" style={{ width: 32, height: 32, fontSize: 13 }}>
                          {resident.fullName[0]}
                        </div>
                        {resident.fullName}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiCreditCard color="var(--color-gray-400)" />
                        <code>{resident.idNumber}</code>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiPhone color="var(--color-gray-400)" />
                        <a href={`tel:${resident.primaryPhone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {resident.primaryPhone}
                        </a>
                      </div>
                    </td>
                    <td>
                      {resident.units.length > 0 ? (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {resident.units.map(u => {
                            const unitMatch = units.find(unitItem => unitItem.id === u.unitId);
                            const category = u.unitCategory || unitMatch?.unitCategory || (unitMatch?.floor === 0 ? 'حاصل' : 'شقة');
                            const dir = u.direction || unitMatch?.direction;
                            const isRent = u.type === 'إيجار' || unitMatch?.type === 'إيجار';
                            return (
                              <span
                                key={u.unitId}
                                className={`badge ${category === 'حاصل' ? 'badge-blue' : 'badge-green'}`}
                                style={{ fontSize: 12, padding: '4px 10px' }}
                                title={isRent ? `مستأجر - المؤجر: ${u.landlordName || unitMatch?.leaseInfo?.landlordName || 'مسجل'}` : 'مالك أصلي'}
                              >
                                {category === 'حاصل' ? '🏪 حاصل' : '🏠 شقة'} {u.unitNumber} {dir ? `(${dir})` : ''} ({isRent ? '📝 إيجار' : ' ملك'})
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="badge badge-gray">لا يوجد</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => { setEditingResident(resident); setIsFormOpen(true); }}
                          className="btn btn-ghost btn-sm"
                          title="تعديل"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => setResetPasswordResident(resident)}
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-warning, #f59e0b)' }}
                          title="إعادة تعيين كلمة المرور"
                        >
                          <FiKey />
                        </button>
                        <button
                          onClick={() => setDeletingResident(resident)}
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-danger)' }}
                          title="حذف"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingResident(null); }}
        title={editingResident ? 'تعديل بيانات الساكن' : 'إضافة ساكن جديد'}
        size="lg"
      >
        <ResidentForm
          initialData={editingResident}
          onSubmit={handleCreateOrUpdate}
          onCancel={() => { setIsFormOpen(false); setEditingResident(null); }}
          loading={actionLoading}
        />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deletingResident}
        onClose={() => setDeletingResident(null)}
        onConfirm={handleDelete}
        title="تأكيد حذف الساكن"
        message={`هل أنت تأكد من حذف الساكن "${deletingResident?.fullName}"؟ سيتم إلغاء ربطه بالشقق وتحريرها.`}
        loading={actionLoading}
      />

      {/* Reset Password Confirm */}
      <ConfirmDialog
        isOpen={!!resetPasswordResident}
        onClose={() => setResetPasswordResident(null)}
        onConfirm={handleResetPassword}
        title="إعادة تعيين كلمة المرور"
        message={`هل تريد إعادة تعيين كلمة مرور "${resetPasswordResident?.fullName}" إلى الافتراضية؟\nكلمة المرور الجديدة ستكون: ${resetPasswordResident?.idNumber}@123`}
        confirmText="نعم، أعد التعيين"
        type="warning"
        loading={resetLoading}
      />
    </div>
  );
};

export default Residents;
