import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getPayments } from '../../services/payments';
import { getResidents } from '../../services/residents';
import type { Payment } from '../../types';
import { FiDollarSign, FiCalendar, FiCheckCircle } from 'react-icons/fi';

const ResidentPayments: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const [allPayments, allResidents] = await Promise.all([getPayments(), getResidents()]);
        const resident = allResidents.find(r => r.email === user?.email);

        if (resident) {
          const resPayments = allPayments.filter(p => p.residentId === resident.id);
          setPayments(resPayments);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [user]);

  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-header-title">💳 سجل الخدمات الشهرية الخاصة بي</h1>
          <div className="page-header-sub">عرض كافة الخدمات الشهرية المسددة مسبقاً وإيصالات الاستلام</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--color-gray-500)', fontWeight: 600 }}>إجمالي ما تم سداده</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-primary-dark)', marginTop: 4 }}>
              {totalPaid} ₪
            </div>
          </div>
          <div className="stat-card-icon green" style={{ width: 60, height: 60, fontSize: 28 }}>
            <FiCheckCircle />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 250 }}>
          <div className="loading-spinner" />
          <p>جارٍ تحميل سجل المدفوعات...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">💳</div>
            <div className="empty-state-title">لا يوجد سجل مدفوعات سابق</div>
            <div className="empty-state-sub">عند قيامك بسداد الفواتير ستظهر إيصالات السداد هنا</div>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>المبلغ المسدد</th>
                <th>طريقة الدفع</th>
                <th>تاريخ الدفع</th>
                <th>رقم الإيصال</th>
                <th>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 800, fontSize: 16, color: 'var(--color-primary-dark)' }}>
                    {p.amount} ₪
                  </td>
                  <td><span className="badge badge-blue">{p.method}</span></td>
                  <td style={{ fontSize: 13 }}>{p.paymentDate.toLocaleDateString('ar-EG')}</td>
                  <td>{p.receipt ? <code>#{p.receipt}</code> : '—'}</td>
                  <td style={{ fontSize: 13, color: 'var(--color-gray-600)' }}>{p.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ResidentPayments;
