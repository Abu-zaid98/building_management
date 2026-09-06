import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getInvoices } from '../../services/invoices';
import { getResidents } from '../../services/residents';
import { getUnits } from '../../services/units';
import { getPayments } from '../../services/payments';
import type { Invoice, Payment, Unit } from '../../types';
import { FiFileText, FiCheckCircle, FiClock, FiAlertTriangle, FiDollarSign } from 'react-icons/fi';

const ResidentInvoices: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [allInvoices, allResidents, allUnits, allPayments] = await Promise.all([
          getInvoices(),
          getResidents(),
          getUnits(),
          getPayments(),
        ]);
        setUnits(allUnits);
        const resident = allResidents.find(r => r.email === user?.email || r.idNumber === user?.displayName);

        if (resident) {
          const resInvoices = allInvoices.filter(i => i.residentId === resident.id);
          const resPayments = allPayments.filter(p => p.residentId === resident.id);
          setInvoices(resInvoices);
          setPayments(resPayments);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const pendingAmount = invoices
    .filter(i => i.status !== 'paid')
    .reduce((acc, i) => acc + i.amount, 0);

  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

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

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-header-title">📄 الخدمات الشهرية والفواتير</h1>
          <div className="page-header-sub">متابعة فواتير الخدمات الشهرية المستحقة وإيصالات السداد لوحداتك (شقق / حواصل)</div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--color-gray-500)', fontWeight: 600 }}>المستحقات المعلقة للدفع</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: pendingAmount > 0 ? 'var(--color-danger)' : 'var(--color-primary-dark)', marginTop: 4 }}>
                {pendingAmount} ₪
              </div>
            </div>
            <div className={`stat-card-icon ${pendingAmount > 0 ? 'orange' : 'green'}`} style={{ width: 52, height: 52, fontSize: 24 }}>
              {pendingAmount > 0 ? <FiClock /> : <FiCheckCircle />}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--color-gray-500)', fontWeight: 600 }}>إجمالي ما تم سداده</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-primary-dark)', marginTop: 4 }}>
                {totalPaid} ₪
              </div>
            </div>
            <div className="stat-card-icon green" style={{ width: 52, height: 52, fontSize: 24 }}>
              <FiCheckCircle />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 250 }}>
          <div className="loading-spinner" />
          <p>جارٍ تحميل الخدمات الشهرية...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <div className="empty-state-title">لا توجد فواتير خدمات شهرية صادرة لك بعد</div>
            <div className="empty-state-sub">سيتم عرض الفواتير الشهرية وإيصالات الدفع هنا بمجرد إصدارها وتحصيلها</div>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>الوحدة (شقة / حاصل)</th>
                <th>الشهر / الفترة</th>
                <th>المبلغ الإجمالي</th>
                <th>تفاصيل الخدمات</th>
                <th>تاريخ الاستحقاق</th>
                <th>الحالة والإيصال</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => {
                const paymentInfo = payments.find(p => p.invoiceId === inv.id);
                return (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 700 }}>
                      {getUnitBadge(inv)}
                    </td>
                    <td><span className="badge badge-gray">{inv.period}</span></td>
                    <td style={{ fontWeight: 800, fontSize: 16 }}>{inv.amount} ₪</td>
                    <td style={{ fontSize: 13 }}>
                      رسوم خدمات: {inv.breakdown.servicesFee} ₪
                      {inv.breakdown.otherFees ? ` + إضافي: ${inv.breakdown.otherFees} ₪ (${inv.breakdown.otherFeesNote || ''})` : ''}
                    </td>
                    <td style={{ fontSize: 13 }}>{inv.dueDate.toLocaleDateString('ar-EG')}</td>
                    <td>
                      {inv.status === 'paid' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span className="badge badge-green" style={{ width: 'fit-content' }}>
                            <FiCheckCircle /> مدفوعة ({paymentInfo?.method || 'نقد'})
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
                        <span className="badge badge-yellow"><FiClock /> معلقة للدفع</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ResidentInvoices;
