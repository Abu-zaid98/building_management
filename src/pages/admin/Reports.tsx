import React, { useState, useEffect } from 'react';
import { getInvoices } from '../../services/invoices';
import { getPayments } from '../../services/payments';
import { getUnits } from '../../services/units';
import { getResidents } from '../../services/residents';
import type { Invoice, Payment, Unit, Resident } from '../../types';
import { exportResidentsToExcel } from '../../utils/exportExcel';
import { FiPrinter, FiFileText, FiDollarSign, FiUsers, FiHome, FiAlertTriangle, FiCheckCircle, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Reports: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'financial' | 'arrears' | 'occupancy'>('financial');

  useEffect(() => {
    Promise.all([getInvoices(), getPayments(), getUnits(), getResidents()])
      .then(([inv, pay, u, r]) => {
        setInvoices(inv);
        setPayments(pay);
        setUnits(u);
        setResidents(r);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalInvoiced = invoices.reduce((acc, i) => acc + i.amount, 0);
  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);
  const pendingInvoices = invoices.filter(i => i.status !== 'paid');
  const totalArrears = pendingInvoices.reduce((acc, i) => acc + i.amount, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    try {
      if (residents.length === 0) {
        toast.error('لا توجد بيانات سكان لتصديرها');
        return;
      }
      exportResidentsToExcel(residents, units);
      toast.success('تم تصدير ملف الإكسل بنجاح 📊');
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء تصدير ملف الإكسل');
    }
  };

  return (
    <div>
      {/* Printable Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-header-title">📊 التقارير والإحصائيات الشاملة</h1>
          <div className="page-header-sub">تقارير التحصيلات المالية، المتأخرات، وبيانات السكان والشقق</div>
        </div>
        <div className="page-header-actions no-print" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={handleExportExcel} className="btn btn-secondary">
            <FiDownload size={18} /> تصدير بيانات السكان (Excel)
          </button>
          <button onClick={handlePrint} className="btn btn-primary">
            <FiPrinter size={18} /> طباعة التقرير
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="card no-print" style={{ marginBottom: 24, padding: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setActiveTab('financial')}
            className={`btn ${activeTab === 'financial' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1 }}
          >
            💰 التقرير المالي والتحصيلات
          </button>
          <button
            onClick={() => setActiveTab('arrears')}
            className={`btn ${activeTab === 'arrears' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1 }}
          >
            ⚠️ تقرير المتأخرات والديون
          </button>
          <button
            onClick={() => setActiveTab('occupancy')}
            className={`btn ${activeTab === 'occupancy' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1 }}
          >
            🏢 تقرير الشقق والسكان
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 250 }}>
          <div className="loading-spinner" />
          <p>جارٍ توليد التقارير...</p>
        </div>
      ) : (
        <div id="printable-area">
          {/* Summary Cards */}
          <div className="grid-3" style={{ marginBottom: 28 }}>
            <div className="stat-card">
              <div className="stat-card-icon blue"><FiFileText /></div>
              <div>
                <div className="stat-card-value">{totalInvoiced} ₪</div>
                <div className="stat-card-label">إجمالي الفواتير الصادرة</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon green"><FiCheckCircle /></div>
              <div>
                <div className="stat-card-value">{totalCollected} ₪</div>
                <div className="stat-card-label">إجمالي التحصيلات الكاش</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon red"><FiAlertTriangle /></div>
              <div>
                <div className="stat-card-value">{totalArrears} ₪</div>
                <div className="stat-card-label">إجمالي الديون المتأخرة</div>
              </div>
            </div>
          </div>

          {/* Financial Tab */}
          {activeTab === 'financial' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">💵 سجل التحصيلات المالية بالتفصيل</div>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <div className="table-wrapper" style={{ border: 'none' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>تاريخ الدفع</th>
                        <th>طريقة الدفع</th>
                        <th>المبلغ (₪)</th>
                        <th>رقم الإيصال</th>
                        <th>ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p, idx) => (
                        <tr key={p.id}>
                          <td>{idx + 1}</td>
                          <td>{p.paymentDate.toLocaleDateString('ar-EG')}</td>
                          <td><span className="badge badge-blue">{p.method}</span></td>
                          <td style={{ fontWeight: 800, color: 'var(--color-primary-dark)' }}>{p.amount} ₪</td>
                          <td>{p.receipt ? <code>#{p.receipt}</code> : '—'}</td>
                          <td>{p.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Arrears Tab */}
          {activeTab === 'arrears' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">⚠️ قائمة الفواتير المتأخرة والديون غير المسددة</div>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <div className="table-wrapper" style={{ border: 'none' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>رقم الشقة</th>
                        <th>اسم الساكن</th>
                        <th>الشهر / الفترة</th>
                        <th>المبلغ المستحق (₪)</th>
                        <th>تاريخ الاستحقاق</th>
                        <th>الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingInvoices.map(inv => (
                        <tr key={inv.id}>
                          <td style={{ fontWeight: 700 }}>شقة {inv.unitNumber}</td>
                          <td>{inv.residentName}</td>
                          <td><span className="badge badge-gray">{inv.period}</span></td>
                          <td style={{ fontWeight: 800, color: 'var(--color-danger)' }}>{inv.amount} ₪</td>
                          <td>{inv.dueDate.toLocaleDateString('ar-EG')}</td>
                          <td><span className="badge badge-red">معلقة / متأخرة</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Occupancy Tab */}
          {activeTab === 'occupancy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Residents & Units Breakdown */}
              <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div className="card-title">👥 سجل وتفاصيل السكان، الطوابق والشقق المربوطة</div>
                  <button onClick={handleExportExcel} className="btn btn-secondary btn-sm no-print">
                    <FiDownload size={15} /> تصدير جدول السكان إلى Excel
                  </button>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  <div className="table-wrapper" style={{ border: 'none' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>الاسم الكامل</th>
                          <th>رقم الهوية</th>
                          <th>رقم الجوال</th>
                          <th>الشقق والطوابق المربوطة</th>
                          <th>نوع الإشغال</th>
                          <th>الجنسية</th>
                          <th>ملاحظات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {residents.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--color-gray-500)' }}>
                              لا يوجد سكان مسجلون حالياً
                            </td>
                          </tr>
                        ) : (
                          residents.map(res => {
                            const unitList = res.units || [];
                            return (
                              <tr key={res.id}>
                                <td style={{ fontWeight: 700, color: 'var(--color-gray-900)' }}>{res.fullName}</td>
                                <td><code>{res.idNumber}</code></td>
                                <td>{res.primaryPhone}</td>
                                <td>
                                  {unitList.length > 0 ? (
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                      {unitList.map(u => {
                                        const unitObj = units.find(unit => unit.id === u.unitId);
                                        const cat = u.unitCategory || unitObj?.unitCategory || (unitObj?.floor === 0 ? 'حاصل' : 'شقة');
                                        const floorLabel = unitObj ? (unitObj.floor === 0 ? 'الأرضي' : `طابق ${unitObj.floor}`) : '';
                                        return (
                                          <span key={u.unitId} className={`badge ${cat === 'حاصل' ? 'badge-blue' : cat === 'مخزن' ? 'badge-gray' : 'badge-green'}`}>
                                            <FiHome size={12} /> {cat === 'حاصل' ? '🏪 حاصل' : cat === 'مخزن' ? '📦 مخزن' : '🏠 شقة'} {u.unitNumber} {floorLabel ? `(${floorLabel})` : ''}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <span className="badge badge-gray">غير مربوط بوحدة</span>
                                  )}
                                </td>
                                <td>
                                  {unitList.length > 0 ? (
                                    unitList.map(u => u.type).join('، ')
                                  ) : '—'}
                                </td>
                                <td>{res.nationality || 'فلسطيني'}</td>
                                <td>{res.notes || '—'}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Units Table */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">🏢 قائمة جميع وحدات وشقق وحواصل ومخازن العمارة</div>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  <div className="table-wrapper" style={{ border: 'none' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>الوحدة والنوع</th>
                          <th>الفئة والتصنيف</th>
                          <th>الطابق</th>
                          <th>المساحة</th>
                          <th>نوع الملكية</th>
                          <th>الحالة</th>
                          <th>رسوم الخدمات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {units.map(u => {
                          const cat = u.unitCategory || (u.floor === 0 ? 'حاصل' : 'شقة');
                          return (
                            <tr key={u.id}>
                              <td style={{ fontWeight: 700 }}>
                                <span className={`badge ${cat === 'حاصل' ? 'badge-blue' : cat === 'مخزن' ? 'badge-gray' : 'badge-green'}`} style={{ marginLeft: 6 }}>
                                  {cat === 'حاصل' ? '🏪 حاصل' : cat === 'مخزن' ? '📦 مخزن' : '🏠 شقة'}
                                </span>
                                رقم {u.unitNumber}
                              </td>
                              <td>{cat === 'حاصل' ? 'حاصل تجاري' : cat === 'مخزن' ? 'مخزن / خدمات' : 'شقة سكنية'}</td>
                              <td>{u.floor === 0 ? 'الأرضي (0)' : `طابق ${u.floor}`}</td>
                              <td>{u.area} م²</td>
                              <td>{u.type}</td>
                              <td>
                                <span className={`badge ${u.status === 'مأهولة' ? 'badge-green' : 'badge-gray'}`}>
                                  {u.status}
                                </span>
                              </td>
                              <td style={{ fontWeight: 700 }}>{u.servicesFee} ₪</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
