import React, { useState, useEffect } from 'react';
import { getPayments, recordPayment, deletePayment } from '../../services/payments';
import { getInvoices } from '../../services/invoices';
import { useAuth } from '../../contexts/AuthContext';
import type { Payment, Invoice, PaymentMethod } from '../../types';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { FiPlus, FiSearch, FiDollarSign, FiCalendar, FiFileText, FiUser, FiCheckCircle, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Payments: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Record Payment Form
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<PaymentMethod>('نقد');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [receipt, setReceipt] = useState('');
  const [notes, setNotes] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsData, invoicesData] = await Promise.all([
        getPayments(),
        getInvoices(),
      ]);
      setPayments(paymentsData);
      setPendingInvoices(invoicesData.filter(i => i.status !== 'paid'));
    } catch (err) {
      toast.error('حدث خطأ في جلب بيانات المدفوعات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInvoiceChange = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    const inv = pendingInvoices.find(i => i.id === invoiceId);
    if (inv) {
      setAmount(inv.amount);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) {
      toast.error('يرجى اختيار الفاتورة');
      return;
    }
    const inv = pendingInvoices.find(i => i.id === selectedInvoiceId);
    if (!inv) return;

    try {
      setActionLoading(true);
      await recordPayment(
        {
          invoiceId: inv.id,
          unitId: inv.unitId,
          residentId: inv.residentId,
          amount,
          method,
          paymentDate: new Date(paymentDate),
          receipt,
          notes,
        },
        user?.uid || ''
      );
      toast.success('تم تسجيل الدفعة وتحديث الفاتورة إلى مدفوعة بنجاح');
      setIsRecordModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('تعذر تسجيل الدفعة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPaymentId) return;
    try {
      setActionLoading(true);
      await deletePayment(deletingPaymentId);
      toast.success('تم حذف الدفعة');
      setDeletingPaymentId(null);
      fetchData();
    } catch (err) {
      toast.error('تعذر حذف الدفعة');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPayments = payments.filter(p =>
    p.receipt?.includes(searchTerm) ||
    p.notes?.includes(searchTerm) ||
    p.method.includes(searchTerm)
  );

  const totalPaymentsAmount = payments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-header-title">💳 سجل الخدمات الشهرية والتحصيلات</h1>
          <div className="page-header-sub">تسجيل وتحصيل الخدمات الشهرية وتحديث حالة الفواتير وإيصالات الاستلام</div>
        </div>
        <button onClick={() => setIsRecordModalOpen(true)} className="btn btn-primary">
          <FiPlus size={18} /> تسجيل خدمة شهرية جديدة
        </button>
      </div>

      {/* Total Card */}
      <div className="card" style={{ marginBottom: 24, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, color: 'var(--color-gray-500)', fontWeight: 600 }}>إجمالي التحصيلات المسجلة</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-primary-dark)', marginTop: 4 }}>
              {totalPaymentsAmount} ₪
            </div>
          </div>
          <div className="stat-card-icon green" style={{ width: 60, height: 60, fontSize: 28 }}>
            <FiCheckCircle />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: 24, padding: 16 }}>
        <div className="search-bar" style={{ maxWidth: 400 }}>
          <input
            type="text"
            placeholder="البحث برقم الإيصال، ملاحظات أو طريقة الدفع..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <FiSearch className="search-bar-icon" />
        </div>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="loading-screen" style={{ minHeight: 250 }}>
          <div className="loading-spinner" />
          <p>جارٍ تحميل سجل المدفوعات...</p>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">💳</div>
            <div className="empty-state-title">لا يوجد دفعات مسجلة بعد</div>
            <div className="empty-state-sub">اضغط "تسجيل دفعة جديدة" لتسجيل المبالغ المستلمة من السكان</div>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>المبلغ (₪)</th>
                <th>طريقة الدفع</th>
                <th>تاريخ الدفع</th>
                <th>رقم الإيصال</th>
                <th>ملاحظات</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 800, fontSize: 16, color: 'var(--color-primary-dark)' }}>
                    {p.amount} ₪
                  </td>
                  <td>
                    <span className="badge badge-blue">{p.method}</span>
                  </td>
                  <td style={{ fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FiCalendar color="var(--color-gray-400)" />
                      {p.paymentDate.toLocaleDateString('ar-EG')}
                    </div>
                  </td>
                  <td>
                    {p.receipt ? <code>#{p.receipt}</code> : <span style={{ color: 'var(--color-gray-400)' }}>—</span>}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--color-gray-600)' }}>
                    {p.notes || '—'}
                  </td>
                  <td>
                    <button
                      onClick={() => setDeletingPaymentId(p.id)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--color-danger)' }}
                      title="حذف"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="تسجيل دفعة جديدة"
      >
        <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label required">الفاتورة المستهدفة</label>
            <select
              className="form-select"
              value={selectedInvoiceId}
              onChange={e => handleInvoiceChange(e.target.value)}
              required
            >
              <option value="">اختر الفاتورة المعلقة...</option>
              {pendingInvoices.map(inv => (
                <option key={inv.id} value={inv.id}>
                  شقة {inv.unitNumber} - {inv.residentName} ({inv.period}) - المبلغ: {inv.amount} ₪
                </option>
              ))}
            </select>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label required">المبلغ المدفوع (₪)</label>
              <input
                type="number"
                className="form-input"
                min={1}
                value={amount}
                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">طريقة الدفع</label>
              <select
                className="form-select"
                value={method}
                onChange={e => setMethod(e.target.value as PaymentMethod)}
              >
                <option value="نقد">نقد (كاش)</option>
                <option value="تحويل">تحويل بنكي</option>
                <option value="شيك">شيك بنكي</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label required">تاريخ الدفع</label>
              <input
                type="date"
                className="form-input"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">رقم الإيصال / السند (اختياري)</label>
              <input
                type="text"
                className="form-input"
                placeholder="مثال: REC-1002"
                value={receipt}
                onChange={e => setReceipt(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">ملاحظات (اختياري)</label>
            <input
              type="text"
              className="form-input"
              placeholder="مثال: دفعة شاملة شهر أغسطس"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={actionLoading}>
              {actionLoading ? 'جارٍ التسجيل...' : 'تسجيل الدفعة وتأكيد الفاتورة'}
            </button>
            <button type="button" onClick={() => setIsRecordModalOpen(false)} className="btn btn-secondary">
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingPaymentId}
        onClose={() => setDeletingPaymentId(null)}
        onConfirm={handleDelete}
        title="تأكيد حذف الدفعة"
        message="هل أنت تأكد من رغبتك في حذف هذا السجل للمدفوعات؟"
        loading={actionLoading}
      />
    </div>
  );
};

export default Payments;
