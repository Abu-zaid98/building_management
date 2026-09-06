import React, { useState, useEffect } from 'react';
import { getInvoices, createInvoice, generateMonthlyInvoices, deleteInvoice, updateInvoiceStatus, updateInvoice } from '../../services/invoices';
import { getUnits } from '../../services/units';
import { getResidents } from '../../services/residents';
import { getPayments, recordPayment, deletePayment, updatePayment } from '../../services/payments';
import { useAuth } from '../../contexts/AuthContext';
import type { Invoice, Unit, Resident, Payment, PaymentMethod } from '../../types';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { FiPlus, FiSearch, FiCheckCircle, FiClock, FiAlertTriangle, FiTrash2, FiLayers, FiDollarSign, FiCalendar, FiFileText, FiRotateCcw, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Invoices: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('الكل');
  const [filterPeriod, setFilterPeriod] = useState<string>('');

  // Modals state
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [revertingInvoice, setRevertingInvoice] = useState<Invoice | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Single Invoice Form
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // "2026-08"
  const [amount, setAmount] = useState<number>(150);
  const [otherFees, setOtherFees] = useState<number>(0);
  const [otherFeesNote, setOtherFeesNote] = useState('');
  const [dueDate, setDueDate] = useState<string>(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));

  // Bulk Generation Form
  const [bulkPeriod, setBulkPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [bulkDueDate, setBulkDueDate] = useState<string>(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));

  // Payment Form State
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('نقد');
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [payReceipt, setPayReceipt] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invData, unitsData, resData, paymentsData] = await Promise.all([
        getInvoices(),
        getUnits(),
        getResidents(),
        getPayments(),
      ]);
      setInvoices(invData);
      setUnits(unitsData);
      setResidents(resData);
      setPayments(paymentsData);
    } catch (err) {
      toast.error('حدث خطأ في جلب بيانات الخدمات الشهرية والفواتير');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUnitChange = (unitId: string) => {
    setSelectedUnitId(unitId);
    const unit = units.find(u => u.id === unitId);
    if (unit) {
      setAmount(unit.servicesFee || 150);
    }
  };

  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnitId) {
      toast.error('يرجى اختيار الوحدة (شقة / حاصل)');
      return;
    }
    const unit = units.find(u => u.id === selectedUnitId);
    if (!unit || !unit.currentOccupantId) {
      toast.error('هذه الوحدة غير مأهولة، لا يمكن إصدار فاتورة لها');
      return;
    }
    const resident = residents.find(r => r.id === unit.currentOccupantId);

    try {
      setActionLoading(true);
      const totalAmount = amount + (otherFees || 0);
      const category = unit.unitCategory || (unit.floor === 0 ? 'حاصل' : 'شقة');
      await createInvoice({
        unitId: unit.id,
        unitNumber: unit.unitNumber,
        unitCategory: category,
        residentId: unit.currentOccupantId,
        residentName: resident?.fullName || 'ساكن',
        period,
        amount: totalAmount,
        breakdown: {
          servicesFee: amount,
          otherFees,
          otherFeesNote,
        },
        dueDate: new Date(dueDate),
        status: 'pending',
      });
      toast.success('تمت إضافة فاتورة الخدمة الشهرية بنجاح');
      setIsSingleModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('تعذر إنشاء الفاتورة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const count = await generateMonthlyInvoices(bulkPeriod, new Date(bulkDueDate));
      if (count > 0) {
        toast.success(`تم توليد ${count} فاتورة خدمة شهرية للشقق والحواصل المأهولة بنجاح`);
      } else {
        toast.error('لم يتم العثور على وحدات مأهولة لتوليد فواتير لها');
      }
      setIsBulkModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('تعذر توليد الفواتير الشهريّة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenPaymentModal = (inv: Invoice) => {
    const existingPayment = payments.find(p => p.invoiceId === inv.id);
    setPayingInvoice(inv);
    if (existingPayment) {
      setEditingPaymentId(existingPayment.id);
      setPayAmount(existingPayment.amount);
      setPayMethod(existingPayment.method);
      setPayDate(existingPayment.paymentDate.toISOString().slice(0, 10));
      setPayReceipt(existingPayment.receipt || '');
      setPayNotes(existingPayment.notes || '');
    } else {
      setEditingPaymentId(null);
      setPayAmount(inv.amount);
      setPayMethod('نقد');
      setPayDate(new Date().toISOString().slice(0, 10));
      setPayReceipt('');
      setPayNotes('');
    }
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;

    try {
      setActionLoading(true);
      if (editingPaymentId) {
        // تحديث إيصال التحصيل القائم
        await updatePayment(editingPaymentId, {
          amount: payAmount,
          method: payMethod,
          paymentDate: new Date(payDate),
          receipt: payReceipt,
          notes: payNotes,
        });
        if (payAmount !== payingInvoice.amount) {
          await updateInvoice(payingInvoice.id, { amount: payAmount });
        }
        toast.success('تم تحديث بيانات التحصيل والإيصال بنجاح');
      } else {
        // تسجيل تحصيل جديد
        await recordPayment(
          {
            invoiceId: payingInvoice.id,
            unitId: payingInvoice.unitId,
            residentId: payingInvoice.residentId,
            amount: payAmount,
            method: payMethod,
            paymentDate: new Date(payDate),
            receipt: payReceipt,
            notes: payNotes,
          },
          user?.uid || ''
        );
        toast.success('تم تحصيل الخدمة الشهرية وتأكيد الفاتورة كمدفوعة بنجاح');
      }
      setPayingInvoice(null);
      setEditingPaymentId(null);
      fetchData();
    } catch (err) {
      toast.error('تعذر تسجيل/تحديث عملية التحصيل');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevertPayment = async () => {
    if (!revertingInvoice) return;
    try {
      setActionLoading(true);
      const existingPayment = payments.find(p => p.invoiceId === revertingInvoice.id);
      if (existingPayment) {
        await deletePayment(existingPayment.id);
      }
      await updateInvoiceStatus(revertingInvoice.id, 'pending', undefined);
      toast.success('تم إلغاء تحصيل الفاتورة وإعادتها إلى قائمة الفواتير المعلقة');
      setRevertingInvoice(null);
      fetchData();
    } catch (err) {
      toast.error('تعذر إلغاء تحصيل الفاتورة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingInvoiceId) return;
    try {
      setActionLoading(true);
      await deleteInvoice(deletingInvoiceId);
      toast.success('تم حذف الفاتورة');
      setDeletingInvoiceId(null);
      fetchData();
    } catch (err) {
      toast.error('تعذر حذف الفاتورة');
    } finally {
      setActionLoading(false);
    }
  };

  const getUnitBadge = (inv: Invoice) => {
    let category = inv.unitCategory;
    if (!category) {
      const matched = units.find(u => u.id === inv.unitId || u.unitNumber === inv.unitNumber);
      category = matched?.unitCategory || (matched?.floor === 0 ? 'حاصل' : 'شقة');
    }
    const isStore = category === 'حاصل' || category === 'مخزن';
    return (
      <span className={`badge ${isStore ? 'badge-blue' : 'badge-green'}`} style={{ fontSize: 12, padding: '4px 10px' }}>
        {isStore ? (category === 'حاصل' ? '🏪 حاصل' : '📦 مخزن') : '🏠 شقة'} {inv.unitNumber}
      </span>
    );
  };

  const getUnitLabelText = (inv: Invoice | null) => {
    if (!inv) return '';
    let category = inv.unitCategory;
    if (!category) {
      const matched = units.find(u => u.id === inv.unitId || u.unitNumber === inv.unitNumber);
      category = matched?.unitCategory || (matched?.floor === 0 ? 'حاصل' : 'شقة');
    }
    return `${category === 'حاصل' ? '🏪 حاصل' : '🏠 شقة'} رقم ${inv.unitNumber}`;
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.unitNumber?.includes(searchTerm) ||
      inv.residentName?.includes(searchTerm) ||
      inv.period.includes(searchTerm);
    const matchesStatus = filterStatus === 'الكل' || inv.status === filterStatus;
    const matchesPeriod = !filterPeriod || inv.period === filterPeriod;
    return matchesSearch && matchesStatus && matchesPeriod;
  });

  // Monthly period stats
  const periodInvoices = filterPeriod ? invoices.filter(i => i.period === filterPeriod) : invoices;
  const periodPaid = periodInvoices.filter(i => i.status === 'paid');
  const periodUnpaid = periodInvoices.filter(i => i.status !== 'paid');
  const periodCollectedAmount = periodPaid.reduce((acc, i) => acc + i.amount, 0);
  const periodUnpaidAmount = periodUnpaid.reduce((acc, i) => acc + i.amount, 0);

  const totalPendingAmount = invoices
    .filter(i => i.status === 'pending' || i.status === 'overdue')
    .reduce((acc, i) => acc + i.amount, 0);

  const totalCollectedAmount = payments.reduce((acc, p) => acc + p.amount, 0);

  // All unique periods in invoices sorted descending
  const availablePeriods = Array.from(new Set(invoices.map(i => i.period))).sort().reverse();

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-header-title">📄 الخدمات الشهرية والفواتير</h1>
          <div className="page-header-sub">إصدار وتتبع وتحصيل فواتير الخدمات الشهرية للشقق والحواصل السكنية والتجارية</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setIsBulkModalOpen(true)} className="btn btn-outline">
            <FiLayers size={18} /> توليد فواتير الشهر (الكل)
          </button>
          <button onClick={() => setIsSingleModalOpen(true)} className="btn btn-primary">
            <FiPlus size={18} /> فاتورة شهرية جديدة
          </button>
        </div>
      </div>

      {/* Monthly Period Filter Panel */}
      <div className="card" style={{ marginBottom: 20, padding: 20, background: 'linear-gradient(135deg, var(--color-primary-50) 0%, #f0f9ff 100%)', border: '1.5px solid var(--color-primary-100)' }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginBottom: filterPeriod ? 16 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>📅</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-primary-dark)' }}>تصفية / استعراض حسب الشهر</div>
              <div style={{ fontSize: 12, color: 'var(--color-gray-500)' }}>اختر شهراً لعرض تفاصيله الكاملة (من دفع ومن لم يدفع)</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginRight: 'auto' }}>
            <button
              className={`btn btn-sm ${!filterPeriod ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilterPeriod('')}
            >الكل</button>
            {availablePeriods.map(p => (
              <button
                key={p}
                className={`btn btn-sm ${filterPeriod === p ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterPeriod(p)}
              >
                <FiCalendar size={13} /> {p}
              </button>
            ))}
          </div>
        </div>

        {filterPeriod && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12, marginTop: 16 }}>
            <div style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: '14px 16px', border: '1px solid var(--color-gray-100)' }}>
              <div style={{ fontSize: 11, color: 'var(--color-gray-500)', marginBottom: 4 }}>📋 إجمالي الفواتير</div>
              <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--color-gray-900)' }}>{periodInvoices.length}</div>
              <div style={{ fontSize: 11, color: 'var(--color-gray-400)' }}>وحدة مفوترة هذا الشهر</div>
            </div>
            <div style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: '14px 16px', border: '1px solid var(--color-success-light, #d1fae5)' }}>
              <div style={{ fontSize: 11, color: 'var(--color-gray-500)', marginBottom: 4 }}>✅ دفعوا هذا الشهر</div>
              <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--color-success, #10b981)' }}>{periodPaid.length}</div>
              <div style={{ fontSize: 11, color: 'var(--color-gray-400)' }}>تم تحصيل: {periodCollectedAmount} ₪</div>
            </div>
            <div style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: '14px 16px', border: '1px solid #fee2e2' }}>
              <div style={{ fontSize: 11, color: 'var(--color-gray-500)', marginBottom: 4 }}>⚠️ لم يدفعوا بعد</div>
              <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--color-danger)' }}>{periodUnpaid.length}</div>
              <div style={{ fontSize: 11, color: 'var(--color-gray-400)' }}>متبقٍ: {periodUnpaidAmount} ₪</div>
            </div>
            <div style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: '14px 16px', border: '1px solid var(--color-gray-100)' }}>
              <div style={{ fontSize: 11, color: 'var(--color-gray-500)', marginBottom: 4 }}>📊 نسبة التحصيل</div>
              <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--color-primary-dark)' }}>
                {periodInvoices.length > 0 ? Math.round((periodPaid.length / periodInvoices.length) * 100) : 0}%
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-gray-400)' }}>
                <div style={{ height: 6, background: '#e5e7eb', borderRadius: 99, marginTop: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 99, background: 'var(--color-primary)', width: `${periodInvoices.length > 0 ? (periodPaid.length / periodInvoices.length) * 100 : 0}%`, transition: 'width 0.4s ease' }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Header */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-card-icon orange"><FiClock /></div>
          <div>
            <div className="stat-card-value">{invoices.filter(i => i.status === 'pending').length}</div>
            <div className="stat-card-label">فواتير معلقة (الكل)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon green"><FiCheckCircle /></div>
          <div>
            <div className="stat-card-value">{totalCollectedAmount} ₪</div>
            <div className="stat-card-label">إجمالي التحصيلات</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon red"><FiAlertTriangle /></div>
          <div>
            <div className="stat-card-value">{totalPendingAmount} ₪</div>
            <div className="stat-card-label">إجمالي المستحقات</div>
          </div>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="card" style={{ marginBottom: 24, padding: 16 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar">
            <input
              type="text"
              placeholder="البحث برقم الشقة/الحاصل، اسم الساكن، أو الشهر..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <FiSearch className="search-bar-icon" />
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--color-gray-500)', fontWeight: 600 }}>الحالة:</span>
            {[
              { label: 'الكل', value: 'الكل' },
              { label: 'معلقة', value: 'pending' },
              { label: 'مدفوعة', value: 'paid' },
              { label: 'متأخرة', value: 'overdue' },
            ].map(item => (
              <button
                key={item.value}
                onClick={() => setFilterStatus(item.value)}
                className={`btn btn-sm ${filterStatus === item.value ? 'btn-primary' : 'btn-ghost'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      {loading ? (
        <div className="loading-screen" style={{ minHeight: 250 }}>
          <div className="loading-spinner" />
          <p>جارٍ تحميل بيانات الخدمات الشهرية...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <div className="empty-state-title">لا توجد فواتير خدمات شهرية</div>
            <div className="empty-state-sub">اضغط "توليد فواتير الشهر" لإصدار الخدمات الشهرية لكل الشقق والحواصل المأهولة بضغطة واحدة</div>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>الوحدة (شقة / حاصل)</th>
                <th>اسم الساكن / المالك</th>
                <th>الشهر / الفترة</th>
                <th>المبلغ (₪)</th>
                <th>تاريخ الاستحقاق</th>
                <th>الحالة والتفاصيل</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(inv => {
                const paymentInfo = payments.find(p => p.invoiceId === inv.id);
                return (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 700 }}>{getUnitBadge(inv)}</td>
                    <td>{inv.residentName}</td>
                    <td><span className="badge badge-gray">{inv.period}</span></td>
                    <td style={{ fontWeight: 800, color: 'var(--color-gray-900)' }}>{inv.amount} ₪</td>
                    <td style={{ fontSize: 13 }}>{inv.dueDate.toLocaleDateString('ar-EG')}</td>
                    <td>
                      {inv.status === 'paid' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span className="badge badge-green" style={{ width: 'fit-content' }}>
                            <FiCheckCircle /> محصلة ({paymentInfo?.method || 'نقد'})
                          </span>
                          {paymentInfo?.receipt && (
                            <span style={{ fontSize: 11, color: 'var(--color-gray-500)' }}>
                              إيصال #{paymentInfo.receipt}
                            </span>
                          )}
                        </div>
                      ) : inv.status === 'overdue' ? (
                        <span className="badge badge-red"><FiAlertTriangle /> متأخرة</span>
                      ) : (
                        <span className="badge badge-yellow"><FiClock /> معلقة</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {inv.status !== 'paid' ? (
                          <button
                            onClick={() => handleOpenPaymentModal(inv)}
                            className="btn btn-primary btn-sm"
                            title="تحصيل الدفعة"
                          >
                            <FiDollarSign /> تحصيل
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenPaymentModal(inv)}
                              className="btn btn-secondary btn-sm"
                              title="تعديل الإيصال / بيانات التحصيل"
                            >
                              <FiEdit2 /> تعديل الإيصال
                            </button>
                            <button
                              onClick={() => setRevertingInvoice(inv)}
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--color-warning)' }}
                              title="إلغاء التحصيل وإعادة الفاتورة لمعلقة"
                            >
                              <FiRotateCcw /> إرجاع لمعلقة
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setDeletingInvoiceId(inv.id)}
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-danger)' }}
                          title="حذف الفاتورة"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Payment Collection / Edit */}
      <Modal
        isOpen={!!payingInvoice}
        onClose={() => { setPayingInvoice(null); setEditingPaymentId(null); }}
        title={editingPaymentId ? "تعديل بيانات تحصيل الفاتورة" : "تحصيل فاتورة الخدمة الشهرية"}
      >
        {payingInvoice && (
          <form onSubmit={handleRecordPaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--color-primary-50)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary-100)' }}>
              <div style={{ fontSize: 13, color: 'var(--color-primary-dark)', fontWeight: 700 }}>
                تفاصيل الفاتورة المستهدفة:
              </div>
              <div style={{ fontSize: 14, color: 'var(--color-gray-800)', marginTop: 4 }}>
                <strong>{getUnitLabelText(payingInvoice)}</strong> — {payingInvoice.residentName} ({payingInvoice.period})
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label required">المبلغ المحصّل (₪)</label>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  value={payAmount}
                  onChange={e => setPayAmount(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label required">طريقة التحصيل / الدفع</label>
                <select
                  className="form-select"
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value as PaymentMethod)}
                >
                  <option value="نقد">نقد (كاش)</option>
                  <option value="تحويل">تحويل بنكي</option>
                  <option value="شيك">شيك بنكي</option>
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label required">تاريخ التحصيل</label>
                <input
                  type="date"
                  className="form-input"
                  value={payDate}
                  onChange={e => setPayDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">رقم الإيصال / السند (اختياري)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="مثال: REC-1002"
                  value={payReceipt}
                  onChange={e => setPayReceipt(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">ملاحظات التحصيل (اختياري)</label>
              <input
                type="text"
                className="form-input"
                placeholder="مثال: تم الاستلام نقداً في مكتب الإدارة"
                value={payNotes}
                onChange={e => setPayNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12, flexWrap: 'wrap' }}>
              <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                {actionLoading ? 'جارٍ الحفظ...' : editingPaymentId ? 'تحديث الإيصال والبيانات' : 'تأكيد التحصيل وإغلاق الفاتورة'}
              </button>
              <button type="button" onClick={() => { setPayingInvoice(null); setEditingPaymentId(null); }} className="btn btn-secondary">
                إلغاء
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Single Invoice */}
      <Modal
        isOpen={isSingleModalOpen}
        onClose={() => setIsSingleModalOpen(false)}
        title="إصدار فاتورة خدمة شهرية جديدة"
      >
        <form onSubmit={handleCreateSingle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label required">الوحدة (شقة / حاصل)</label>
            <select
              className="form-select"
              value={selectedUnitId}
              onChange={e => handleUnitChange(e.target.value)}
              required
            >
              <option value="">اختر الوحدة (شقة أو حاصل)...</option>
              {units.filter(u => u.status === 'مأهولة').map(u => {
                const cat = u.unitCategory || (u.floor === 0 ? 'حاصل' : 'شقة');
                const floorLabel = u.floor === 0 ? 'الطابق الأرضي' : `الطابق ${u.floor}`;
                return (
                  <option key={u.id} value={u.id}>
                    {cat === 'حاصل' ? '🏪 حاصل' : '🏠 شقة'} رقم {u.unitNumber} ({floorLabel} - رسوم الخدمات: {u.servicesFee} ₪)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label required">الشهر / الفترة</label>
              <input
                type="month"
                className="form-input"
                value={period}
                onChange={e => setPeriod(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">تاريخ الاستحقاق</label>
              <input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label required">رسوم الخدمات (₪)</label>
              <input
                type="number"
                className="form-input"
                min={0}
                value={amount}
                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">رسوم إضافية (اختياري)</label>
              <input
                type="number"
                className="form-input"
                min={0}
                value={otherFees}
                onChange={e => setOtherFees(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {otherFees > 0 && (
            <div className="form-group">
              <label className="form-label">سبب الرسوم الإضافية</label>
              <input
                type="text"
                className="form-input"
                placeholder="مثال: صيانة للمصعد"
                value={otherFeesNote}
                onChange={e => setOtherFeesNote(e.target.value)}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12, flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary" disabled={actionLoading}>
              {actionLoading ? 'جارٍ الإصدار...' : 'حفظ وإصدار الفاتورة'}
            </button>
            <button type="button" onClick={() => setIsSingleModalOpen(false)} className="btn btn-secondary">
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Bulk Generation */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="توليد فواتير الخدمة الشهرية لجميع الشقق المأهولة"
      >
        <form onSubmit={handleGenerateBulk} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 14, color: 'var(--color-gray-600)' }}>
            سيتم إنشاء فاتورة خدمة شهرية جديدة تلقائياً لكل شقة مأهولة بناءً على قيمة رسوم الخدمات الخاصة بها.
          </p>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label required">الفترة (الشهر)</label>
              <input
                type="month"
                className="form-input"
                value={bulkPeriod}
                onChange={e => setBulkPeriod(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">تاريخ الاستحقاق</label>
              <input
                type="date"
                className="form-input"
                value={bulkDueDate}
                onChange={e => setBulkDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12, flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary" disabled={actionLoading}>
              {actionLoading ? 'جارٍ التوليد...' : 'بدء التوليد الجماعي'}
            </button>
            <button type="button" onClick={() => setIsBulkModalOpen(false)} className="btn btn-secondary">
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      {/* Revert Collection Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!revertingInvoice}
        onClose={() => setRevertingInvoice(null)}
        onConfirm={handleRevertPayment}
        title="تأكيد إلغاء التحصيل"
        message={`هل أنت تأكد من إلغاء تحصيل الفاتورة للشقة رقم (${revertingInvoice?.unitNumber}) لـ ${revertingInvoice?.residentName}؟ سيتم حذف الإيصال وإعادة الفاتورة كـ "معلقة".`}
        loading={actionLoading}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingInvoiceId}
        onClose={() => setDeletingInvoiceId(null)}
        onConfirm={handleDelete}
        title="تأكيد حذف الفاتورة"
        message="هل أنت تأكد من رغبتك في حذف هذه الفاتورة؟"
        loading={actionLoading}
      />
    </div>
  );
};

export default Invoices;
