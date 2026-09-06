import React, { useState, useEffect, useMemo } from 'react';
import {
  getFundTransactions,
  addFundTransaction,
  updateFundTransaction,
  deleteFundTransaction,
  clearAllFundTransactions,
} from '../../services/fund';
import type {
  FundTransaction,
  FundTransactionFormData,
  FundTransactionType,
  PaymentMethod
} from '../../types';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiCalendar,
  FiFileText,
  FiPrinter,
  FiExternalLink,
  FiCheckCircle,
  FiAlertCircle,
  FiGrid,
  FiList,
  FiRefreshCw
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const EXPENSE_CATEGORIES = [
  'صيانة مصعد',
  'كهرباء عامة ومصعد',
  'مياه وخزانات عامة',
  'نظافة ومواد استهلاكية',
  'أجور عمال وحراسة',
  'صيانة مضخات وسباكة',
  'أعمال إنارة وكهرباء',
  'صيانة مبنى وترميم',
  'مشتريات وأدوات عامة',
  'مصاريف إدارية وقانونية',
  'أخرى',
];

const INCOME_CATEGORIES = [
  'تحصيل رسوم خدمات شهرية',
  'إيجار حاصل / محل تجاري',
  'إيجار مخزن / موقف',
  'مساهمة ملاك لصيانة خاصة',
  'تبرعات ودعم للصندوق',
  'عوائد وغرامات تأخير',
  'رصيد افتتاحي للخزينة',
  'أخرى',
];

const Treasury: React.FC = () => {
  const [transactions, setTransactions] = useState<FundTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'cards' or 'table'
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // 'all' or 'YYYY-MM'
  const [selectedType, setSelectedType] = useState<string>('all'); // 'all' | 'income' | 'expense'
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FundTransaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<FundTransaction | null>(null);
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<FundTransactionFormData>({
    type: 'expense',
    category: EXPENSE_CATEGORIES[0],
    title: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    invoiceReceiptUrl: '',
    paidToOrReceivedFrom: '',
    paymentMethod: 'نقد',
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getFundTransactions();
      setTransactions(data);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء جلب حركات الصندوق');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Extract unique months list from transactions
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    transactions.forEach(t => {
      if (t.date && t.date.length >= 7) {
        monthsSet.add(t.date.substring(0, 7)); // YYYY-MM
      }
    });

    const currentYearMonth = new Date().toISOString().substring(0, 7);
    monthsSet.add(currentYearMonth);

    return Array.from(monthsSet).sort().reverse();
  }, [transactions]);

  // Overall Total Stats (All time)
  const allTimeIncome = useMemo(() => {
    return transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  const allTimeExpense = useMemo(() => {
    return transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  const allTimeBalance = allTimeIncome - allTimeExpense;

  // Selected Period Stats
  const periodTransactions = useMemo(() => {
    if (selectedMonth === 'all') return transactions;
    return transactions.filter(t => t.date && t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  const periodIncome = useMemo(() => {
    return periodTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  }, [periodTransactions]);

  const periodExpense = useMemo(() => {
    return periodTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  }, [periodTransactions]);

  const periodNet = periodIncome - periodExpense;

  // Filtered transactions for view
  const filteredTransactions = useMemo(() => {
    return periodTransactions.filter(t => {
      const matchesType = selectedType === 'all' || t.type === selectedType;
      const matchesCat = selectedCategory === 'all' || t.category === selectedCategory;
      const matchesSearch =
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.paidToOrReceivedFrom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

      return matchesType && matchesCat && matchesSearch;
    });
  }, [periodTransactions, selectedType, selectedCategory, searchTerm]);

  // Monthly breakdown for Council overview
  const monthlySummaryList = useMemo(() => {
    const map = new Map<string, { income: number; expense: number; count: number }>();
    transactions.forEach(t => {
      const ym = t.date ? t.date.substring(0, 7) : 'غير محدد';
      if (!map.has(ym)) {
        map.set(ym, { income: 0, expense: 0, count: 0 });
      }
      const entry = map.get(ym)!;
      entry.count += 1;
      if (t.type === 'income') entry.income += t.amount;
      if (t.type === 'expense') entry.expense += t.amount;
    });

    return Array.from(map.entries())
      .map(([ym, data]) => ({
        yearMonth: ym,
        income: data.income,
        expense: data.expense,
        net: data.income - data.expense,
        count: data.count,
      }))
      .sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));
  }, [transactions]);

  const openAddModal = (defaultType: FundTransactionType = 'expense') => {
    setEditingTransaction(null);
    setFormData({
      type: defaultType,
      category: defaultType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0],
      title: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      invoiceNumber: '',
      invoiceReceiptUrl: '',
      paidToOrReceivedFrom: '',
      paymentMethod: 'نقد',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (t: FundTransaction) => {
    setEditingTransaction(t);
    setFormData({
      type: t.type,
      category: t.category,
      title: t.title,
      amount: t.amount,
      date: t.date,
      invoiceNumber: t.invoiceNumber || '',
      invoiceReceiptUrl: t.invoiceReceiptUrl || '',
      paidToOrReceivedFrom: t.paidToOrReceivedFrom || '',
      paymentMethod: t.paymentMethod,
      notes: t.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('يرجى إدخال بيان أو وصف المعاملة');
      return;
    }
    if (formData.amount <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }
    if (!formData.date) {
      toast.error('يرجى تحديد تاريخ المعاملة');
      return;
    }

    try {
      setActionLoading(true);
      if (editingTransaction) {
        await updateFundTransaction(editingTransaction.id, formData);
        toast.success('تم تحديث وتعديل المعاملة المالية بنجاح 🏦');
      } else {
        await addFundTransaction(formData);
        toast.success(`تم تسجيل ${formData.type === 'income' ? 'الإيراد' : 'المصروف'} بنجاح 💰`);
      }
      setIsModalOpen(false);
      setEditingTransaction(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('تعذر حفظ المعاملة المالية');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTransaction) return;
    try {
      setActionLoading(true);
      await deleteFundTransaction(deletingTransaction.id);
      toast.success('تم حذف المعاملة المالية من الصندوق بنجاح');
      setDeletingTransaction(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('تعذر حذف المعاملة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearAll = async () => {
    try {
      setActionLoading(true);
      await clearAllFundTransactions();
      toast.success('تم تفريغ وحذف كافة السجلات المؤقتة بنجاح');
      setIsClearAllDialogOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('تعذر تصفير السجلات');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 28, paddingBottom: 16, borderBottom: '1px solid var(--color-gray-200)' }}>
        <div className="page-header-left">
          <h1 className="page-header-title" style={{ fontSize: 26, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>🏦</span> صندوق وخزينة العمارة (المالية الشاملة)
          </h1>
          <div className="page-header-sub" style={{ fontSize: 14, color: 'var(--color-gray-600)', marginTop: 6 }}>
            إدارة حركة المقبوضات والمصروفات، الفواتير، وتقارير الدخل والمصروفات الشهرية والإجمالية لمجلس الإدارة
          </div>
        </div>
        <div className="page-header-actions no-print" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {transactions.length > 0 && (
            <>
              <button
                onClick={() => setIsClearAllDialogOpen(true)}
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--color-danger)', border: '1px solid #FECACA', padding: '9px 14px', borderRadius: 'var(--radius-md)' }}
                title="تفريغ كافة البيانات والبدء من الصفر"
              >
                <FiTrash2 size={16} /> تصفير الصندوق (حذف الكل)
              </button>
              <button onClick={handlePrint} className="btn btn-secondary" style={{ padding: '10px 18px', fontWeight: 700, borderRadius: 'var(--radius-md)' }}>
                <FiPrinter size={18} /> طباعة التقرير
              </button>
            </>
          )}
          <button
            onClick={() => openAddModal('income')}
            className="btn"
            style={{ background: '#059669', color: '#fff', padding: '10px 20px', fontWeight: 800, borderRadius: 'var(--radius-md)' }}
          >
            <FiTrendingUp size={18} /> + تسجيل إيراد / دخل
          </button>
          <button
            onClick={() => openAddModal('expense')}
            className="btn"
            style={{ background: '#DC2626', color: '#fff', padding: '10px 20px', fontWeight: 800, borderRadius: 'var(--radius-md)' }}
          >
            <FiTrendingDown size={18} /> - تسجيل مصروف / فاتورة
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px auto' }} />
          <p style={{ color: 'var(--color-gray-600)', fontSize: 15, fontWeight: 600 }}>جارٍ تحميل بيانات صندوق العمارة...</p>
        </div>
      ) : transactions.length === 0 ? (
        /* Empty State when NO transactions have been entered yet */
        <div
          className="card"
          style={{
            padding: '60px 30px',
            textAlign: 'center',
            borderRadius: 'var(--radius-xl)',
            border: '2px dashed var(--color-gray-300)',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
            maxWidth: 720,
            margin: '40px auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ fontSize: 60, marginBottom: 16 }}>🏦</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-gray-900)', marginBottom: 10 }}>
            لم يتم تسجيل أي حركات مالية في صندوق العمارة بعد
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-gray-600)', maxWidth: 540, margin: '0 auto 28px auto', lineHeight: 1.7 }}>
            صندوق وخزينة العمارة فارغ حالياً وجاهز لبياناتك الحقيقية. ابدأ الآن بتسجيل <strong>رصيد افتتاحي</strong> أو إيرادات رسوم الخدمات،
            أو توثيق أول <strong>فاتورة مصروفات</strong> (مثل صيانة المصعد، فاتورة الكهرباء، أو أجور الصيانة).
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => openAddModal('income')}
              className="btn"
              style={{ background: '#059669', color: '#fff', padding: '12px 24px', fontWeight: 800, borderRadius: 'var(--radius-md)' }}
            >
              <FiTrendingUp size={18} /> + تسجيل أول حركة إيراد / دخل
            </button>
            <button
              onClick={() => openAddModal('expense')}
              className="btn"
              style={{ background: '#DC2626', color: '#fff', padding: '12px 24px', fontWeight: 800, borderRadius: 'var(--radius-md)' }}
            >
              <FiTrendingDown size={18} /> - تسجيل أول مصروف / فاتورة
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Month / Period Filter Banner */}
          <div
            className="card no-print"
            style={{
              marginBottom: 24,
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
              border: '1.5px solid #BFDBFE',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: '#DBEAFE', padding: 10, borderRadius: 10, color: 'var(--color-primary)' }}>
                  <FiCalendar size={24} />
                </div>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--color-gray-600)', fontWeight: 700 }}>الفترة المعروضة للحسابات:</span>
                  <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--color-primary)', marginTop: 2 }}>
                    {selectedMonth === 'all' ? '📊 إجمالي جميع الفترات التراكمية' : `📅 تقرير شهر ${selectedMonth}`}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <label style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-gray-700)' }}>تغيير الشهر:</label>
                <select
                  className="form-select"
                  style={{ minWidth: 200, fontWeight: 700, paddingBlock: 10, borderRadius: 'var(--radius-md)' }}
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                >
                  <option value="all">🌟 جميع الأشهر (إجمالي الصندوق)</option>
                  {availableMonths.map(ym => (
                    <option key={ym} value={ym}>
                      شهر {ym}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Top KPI Summary Cards */}
          <div className="stats-grid" style={{ marginBottom: 28, gap: 18 }}>
            {/* Total Net Treasury Balance */}
            <div className="stat-card" style={{ padding: '22px', borderRadius: 'var(--radius-lg)', borderRight: '4px solid #4F46E5' }}>
              <div className="stat-icon" style={{ background: '#EEF2FF', color: '#4F46E5', width: 50, height: 50, borderRadius: 12 }}>
                <FiDollarSign size={26} />
              </div>
              <div className="stat-info">
                <div className="stat-value" style={{ fontSize: 26, fontWeight: 900, color: allTimeBalance >= 0 ? '#16A34A' : '#DC2626' }}>
                  {allTimeBalance.toLocaleString()} ₪
                </div>
                <div className="stat-label" style={{ marginTop: 4 }}>
                  <strong style={{ fontSize: 13, color: 'var(--color-gray-800)' }}>🏦 رصيد الخزينة التراكمي الحالي</strong>
                  <div style={{ fontSize: 11.5, color: 'var(--color-gray-500)', marginTop: 2 }}>
                    (الدخل الكلي: {allTimeIncome.toLocaleString()} ₪ - المصاريف: {allTimeExpense.toLocaleString()} ₪)
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Period Income */}
            <div className="stat-card" style={{ padding: '22px', borderRadius: 'var(--radius-lg)', borderRight: '4px solid #16A34A' }}>
              <div className="stat-icon" style={{ background: '#ECFDF5', color: '#059669', width: 50, height: 50, borderRadius: 12 }}>
                <FiTrendingUp size={26} />
              </div>
              <div className="stat-info">
                <div className="stat-value" style={{ fontSize: 26, fontWeight: 900, color: '#059669' }}>
                  +{periodIncome.toLocaleString()} ₪
                </div>
                <div className="stat-label" style={{ marginTop: 4 }}>
                  <strong style={{ fontSize: 13, color: 'var(--color-gray-800)' }}>إيرادات الفترة {selectedMonth === 'all' ? 'الكلية' : `(${selectedMonth})`}</strong>
                  <div style={{ fontSize: 11.5, color: 'var(--color-gray-500)', marginTop: 2 }}>
                    {periodTransactions.filter(t => t.type === 'income').length} حركات مقبوضات مسجلة
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Period Expenses */}
            <div className="stat-card" style={{ padding: '22px', borderRadius: 'var(--radius-lg)', borderRight: '4px solid #DC2626' }}>
              <div className="stat-icon" style={{ background: '#FEF2F2', color: '#DC2626', width: 50, height: 50, borderRadius: 12 }}>
                <FiTrendingDown size={26} />
              </div>
              <div className="stat-info">
                <div className="stat-value" style={{ fontSize: 26, fontWeight: 900, color: '#DC2626' }}>
                  -{periodExpense.toLocaleString()} ₪
                </div>
                <div className="stat-label" style={{ marginTop: 4 }}>
                  <strong style={{ fontSize: 13, color: 'var(--color-gray-800)' }}>مصروفات الفترة {selectedMonth === 'all' ? 'الكلية' : `(${selectedMonth})`}</strong>
                  <div style={{ fontSize: 11.5, color: 'var(--color-gray-500)', marginTop: 2 }}>
                    {periodTransactions.filter(t => t.type === 'expense').length} فواتير ومصروفات مسجلة
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Period Net Surplus/Deficit */}
            <div className="stat-card" style={{ padding: '22px', borderRadius: 'var(--radius-lg)', borderRight: `4px solid ${periodNet >= 0 ? '#10B981' : '#F59E0B'}` }}>
              <div className="stat-icon" style={{ background: periodNet >= 0 ? '#F0FDF4' : '#FFFBEB', color: periodNet >= 0 ? '#16A34A' : '#D97706', width: 50, height: 50, borderRadius: 12 }}>
                {periodNet >= 0 ? <FiCheckCircle size={26} /> : <FiAlertCircle size={26} />}
              </div>
              <div className="stat-info">
                <div className="stat-value" style={{ fontSize: 26, fontWeight: 900, color: periodNet >= 0 ? '#16A34A' : '#D97706' }}>
                  {periodNet >= 0 ? `+${periodNet.toLocaleString()} ₪` : `${periodNet.toLocaleString()} ₪`}
                </div>
                <div className="stat-label" style={{ marginTop: 4 }}>
                  <strong style={{ fontSize: 13, color: 'var(--color-gray-800)' }}>{periodNet >= 0 ? 'صافي فائض الفترة' : 'صافي عجز الفترة'}</strong>
                  <div style={{ fontSize: 11.5, color: 'var(--color-gray-500)', marginTop: 2 }}>
                    {periodNet >= 0 ? 'فائض تشغيلي متاح في الصندوق' : 'عجز مؤقت تم تغطيته من رصيد الخزينة'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Summary Overview Table for Council */}
          {monthlySummaryList.length > 0 && (
            <div className="card" style={{ padding: '24px', marginBottom: 28, borderRadius: 'var(--radius-lg)' }}>
              <div className="card-header" style={{ marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900 }}>📊 جدول المقارنة الشهرية (دخل ومصروفات وصافي كل شهر)</h3>
                  <span style={{ fontSize: 13, color: 'var(--color-gray-500)' }}>تقرير ملخص لمجلس الإدارة يوضح حركة كل شهر على حدة</span>
                </div>
              </div>

              <div className="table-responsive" style={{ maxHeight: 240, overflowY: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ padding: '14px 18px' }}>الشهر</th>
                      <th style={{ padding: '14px 18px' }}>إجمالي الدخل (₪)</th>
                      <th style={{ padding: '14px 18px' }}>إجمالي المصروفات (₪)</th>
                      <th style={{ padding: '14px 18px' }}>صافي الفائض / العجز (₪)</th>
                      <th style={{ padding: '14px 18px' }}>عدد الفواتير والحركات</th>
                      <th className="no-print" style={{ padding: '14px 18px' }}>إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlySummaryList.map(row => (
                      <tr key={row.yearMonth} style={{ background: selectedMonth === row.yearMonth ? '#EFF6FF' : undefined }}>
                        <td style={{ padding: '14px 18px' }}>
                          <strong style={{ fontSize: 14 }}>شهر {row.yearMonth}</strong>
                        </td>
                        <td style={{ padding: '14px 18px', color: '#16A34A', fontWeight: 800, fontSize: 14 }}>
                          +{row.income.toLocaleString()} ₪
                        </td>
                        <td style={{ padding: '14px 18px', color: '#DC2626', fontWeight: 800, fontSize: 14 }}>
                          -{row.expense.toLocaleString()} ₪
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span className={`badge ${row.net >= 0 ? 'badge-green' : 'badge-red'}`} style={{ fontWeight: 800, padding: '5px 12px', fontSize: 12 }}>
                            {row.net >= 0 ? `+${row.net.toLocaleString()} ₪ فائض` : `${row.net.toLocaleString()} ₪ عجز`}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: 13 }}>{row.count} معاملة</td>
                        <td className="no-print" style={{ padding: '14px 18px' }}>
                          <button
                            onClick={() => setSelectedMonth(row.yearMonth)}
                            className={`btn btn-sm ${selectedMonth === row.yearMonth ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ padding: '6px 14px', fontWeight: 700 }}
                          >
                            {selectedMonth === row.yearMonth ? 'معروض حالياً' : 'عرض التفاصيل'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detailed Transactions Section */}
          <div className="card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            {/* Card Header with View Switcher */}
            <div className="card-header" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>
                  📝 سجل القيود والفواتير التفصيلي ({filteredTransactions.length} قيد)
                </h3>
                <span style={{ fontSize: 13, color: 'var(--color-gray-500)', display: 'block', marginTop: 3 }}>
                  إمكانية التعديل والحذف المباشر لكل بند تم إدخاله مع تفاصيل الفاتورة والمستفيد
                </span>
              </div>

              {/* View Mode Toggle: Cards vs Table */}
              <div className="no-print" style={{ display: 'flex', background: 'var(--color-gray-100)', padding: 4, borderRadius: 'var(--radius-md)', gap: 4 }}>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`btn btn-sm ${viewMode === 'cards' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontWeight: 700 }}
                >
                  <FiGrid size={15} /> عرض البطاقات
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontWeight: 700 }}
                >
                  <FiList size={15} /> عرض الجدول
                </button>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="no-print" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 22, alignItems: 'center' }}>
              {/* Search */}
              <div style={{ flex: '1 1 240px', position: 'relative' }}>
                <FiSearch style={{ position: 'absolute', right: 12, top: 12, color: 'var(--color-gray-400)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingRight: 36, paddingBlock: 9, borderRadius: 'var(--radius-md)' }}
                  placeholder="بحث بالبيان، رقم الفاتورة، أو الجهة..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Type Filter */}
              <div style={{ minWidth: 180 }}>
                <select
                  className="form-select"
                  style={{ paddingBlock: 9, borderRadius: 'var(--radius-md)' }}
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value)}
                >
                  <option value="all">كل الأنواع (دخل ومصروف)</option>
                  <option value="income">💵 إيرادات ومقبوضات فقط</option>
                  <option value="expense">💸 مصروفات وفواتير فقط</option>
                </select>
              </div>

              {/* Category Filter */}
              <div style={{ minWidth: 200 }}>
                <select
                  className="form-select"
                  style={{ paddingBlock: 9, borderRadius: 'var(--radius-md)' }}
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                >
                  <option value="all">كل البنود والتصنيفات</option>
                  <optgroup label="بنود المصروفات">
                    {EXPENSE_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </optgroup>
                  <optgroup label="بنود الإيرادات">
                    {INCOME_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Content: Empty Search or Results */}
            {filteredTransactions.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
                <h4 style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-gray-800)', marginBottom: 6 }}>لا توجد معاملات مطابقة للبحث</h4>
                <p style={{ fontSize: 13, color: 'var(--color-gray-500)', margin: 0 }}>جرب تعديل خيارات الفلتر المحددة أعلاه</p>
              </div>
            ) : viewMode === 'cards' ? (
              /* ===== 1. CARDS VIEW (Spacious, prominent Edit & Delete) ===== */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
                {filteredTransactions.map(t => (
                  <div
                    key={t.id}
                    style={{
                      background: '#FFFFFF',
                      border: `1.5px solid ${t.type === 'income' ? '#BBF7D0' : '#FECACA'}`,
                      borderRadius: 'var(--radius-lg)',
                      padding: '20px 22px',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      borderTop: `5px solid ${t.type === 'income' ? '#16A34A' : '#DC2626'}`
                    }}
                  >
                    <div>
                      {/* Card Header: Type Badge & Amount */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span
                          className={`badge ${t.type === 'income' ? 'badge-green' : 'badge-red'}`}
                          style={{ fontSize: 12, fontWeight: 800, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                          {t.type === 'income' ? <FiTrendingUp size={14} /> : <FiTrendingDown size={14} />}
                          {t.type === 'income' ? 'إيراد / دخل' : 'مصروف / فاتورة'}
                        </span>

                        <div style={{ fontSize: 20, fontWeight: 900, color: t.type === 'income' ? '#16A34A' : '#DC2626', direction: 'ltr' }}>
                          {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} ₪
                        </div>
                      </div>

                      {/* Title */}
                      <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-gray-900)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                        {t.title}
                      </h4>

                      {/* Info Badges & Details */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                        <span className="badge badge-purple" style={{ fontSize: 12, padding: '4px 10px' }}>
                          📁 {t.category}
                        </span>
                        <span className="badge badge-gray" style={{ fontSize: 12, padding: '4px 10px' }}>
                          📅 {t.date}
                        </span>
                        <span className="badge badge-blue" style={{ fontSize: 12, padding: '4px 10px' }}>
                          💳 {t.paymentMethod}
                        </span>
                      </div>

                      {/* Invoice & Party Details Box */}
                      <div style={{
                        background: 'var(--color-gray-50)',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-gray-200)',
                        fontSize: 12.5,
                        color: 'var(--color-gray-700)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        marginBottom: 12
                      }}>
                        {t.invoiceNumber && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FiFileText color="var(--color-primary)" />
                            <strong>رقم الفاتورة:</strong>
                            <code style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-gray-900)' }}>{t.invoiceNumber}</code>
                            {t.invoiceReceiptUrl && (
                              <a
                                href={t.invoiceReceiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: 3, marginRight: 6 }}
                              >
                                <FiExternalLink size={12} /> عرض المرفق
                              </a>
                            )}
                          </div>
                        )}

                        {t.paidToOrReceivedFrom && (
                          <div>
                            <strong>{t.type === 'income' ? 'الجهة الدافعة:' : 'المستفيد / المصروف له:'}</strong> {t.paidToOrReceivedFrom}
                          </div>
                        )}

                        {t.notes && (
                          <div style={{ color: 'var(--color-gray-500)', fontStyle: 'italic', marginTop: 2 }}>
                            💡 {t.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Prominent Action Buttons on each Card */}
                    <div style={{
                      display: 'flex',
                      gap: 10,
                      justifyContent: 'stretch',
                      borderTop: '1px solid var(--color-gray-200)',
                      paddingTop: 12,
                      marginTop: 6
                    }}>
                      <button
                        type="button"
                        onClick={() => openEditModal(t)}
                        className="btn btn-secondary"
                        style={{
                          flex: 1,
                          justifyContent: 'center',
                          padding: '9px 12px',
                          fontWeight: 800,
                          fontSize: 13,
                          borderRadius: 'var(--radius-md)'
                        }}
                      >
                        <FiEdit2 size={15} /> تعديل البند
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingTransaction(t)}
                        className="btn btn-ghost"
                        style={{
                          flex: 1,
                          justifyContent: 'center',
                          padding: '9px 12px',
                          fontWeight: 800,
                          fontSize: 13,
                          color: 'var(--color-danger)',
                          border: '1px solid #FECACA',
                          borderRadius: 'var(--radius-md)'
                        }}
                      >
                        <FiTrash2 size={15} /> حذف البند
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* ===== 2. TABLE VIEW (Dense, structured, explicit buttons) ===== */
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ padding: '14px 16px' }}>النوع</th>
                      <th style={{ padding: '14px 16px' }}>التاريخ</th>
                      <th style={{ padding: '14px 16px' }}>البيان / الوصف</th>
                      <th style={{ padding: '14px 16px' }}>البند / التصنيف</th>
                      <th style={{ padding: '14px 16px' }}>المبلغ (₪)</th>
                      <th style={{ padding: '14px 16px' }}>رقم الفاتورة</th>
                      <th style={{ padding: '14px 16px' }}>الجهة</th>
                      <th style={{ padding: '14px 16px' }}>طريقة الدفع</th>
                      <th className="no-print" style={{ padding: '14px 16px', textAlign: 'center' }}>إجراءات البند</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map(t => (
                      <tr key={t.id}>
                        <td style={{ padding: '14px 16px' }}>
                          <span className={`badge ${t.type === 'income' ? 'badge-green' : 'badge-red'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 800, padding: '5px 10px' }}>
                            {t.type === 'income' ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
                            {t.type === 'income' ? 'إيراد' : 'مصروف'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', fontSize: 13, direction: 'ltr' }}>
                          {t.date}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 800, color: 'var(--color-gray-900)', fontSize: 14 }}>{t.title}</div>
                          {t.notes && (
                            <div style={{ fontSize: 12, color: 'var(--color-gray-500)', marginTop: 3 }}>
                              {t.notes}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span className="badge badge-purple" style={{ fontSize: 12, padding: '4px 8px' }}>
                            {t.category}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 900, fontSize: 15, color: t.type === 'income' ? '#16A34A' : '#DC2626', whiteSpace: 'nowrap' }}>
                          {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} ₪
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {t.invoiceNumber ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <FiFileText color="var(--color-primary)" size={14} />
                              <code style={{ fontSize: 12.5, fontWeight: 700 }}>{t.invoiceNumber}</code>
                              {t.invoiceReceiptUrl && (
                                <a
                                  href={t.invoiceReceiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="عرض المرفق"
                                  style={{ color: 'var(--color-primary)', marginRight: 4 }}
                                >
                                  <FiExternalLink size={13} />
                                </a>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--color-gray-400)', fontSize: 12 }}>بدون</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 13 }}>
                          {t.paidToOrReceivedFrom || '—'}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span className="badge badge-blue" style={{ fontSize: 11, padding: '4px 8px' }}>
                            {t.paymentMethod}
                          </span>
                        </td>
                        <td className="no-print" style={{ padding: '14px 16px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button
                              onClick={() => openEditModal(t)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '5px 12px', fontWeight: 700 }}
                              title="تعديل القيد"
                            >
                              <FiEdit2 size={13} /> تعديل
                            </button>
                            <button
                              onClick={() => setDeletingTransaction(t)}
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--color-danger)', border: '1px solid #FECACA', padding: '5px 12px', fontWeight: 700 }}
                              title="حذف القيد"
                            >
                              <FiTrash2 size={13} /> حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add / Edit Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingTransaction
            ? `✏️ تعديل المعاملة المالية: ${editingTransaction.title}`
            : formData.type === 'income'
            ? '➕ تسجيل إيراد / دخل وارد للخزينة'
            : '➕ تسجيل مصروف / فاتورة مدفوعة'
        }
      >
        <form onSubmit={handleSaveTransaction} style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '4px 0' }}>
          {/* Type Toggle */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label required" style={{ fontWeight: 800, marginBottom: 8 }}>نوع الحركة المالية</label>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    type: 'expense',
                    category: EXPENSE_CATEGORIES[0]
                  });
                }}
                className={`btn ${formData.type === 'expense' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, justifyContent: 'center', paddingBlock: 12, fontWeight: 800, background: formData.type === 'expense' ? '#DC2626' : undefined }}
              >
                💸 مصروف / فاتورة مدفوعة
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    type: 'income',
                    category: INCOME_CATEGORIES[0]
                  });
                }}
                className={`btn ${formData.type === 'income' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, justifyContent: 'center', paddingBlock: 12, fontWeight: 800, background: formData.type === 'income' ? '#059669' : undefined }}
              >
                💵 إيراد / دخل وارد للصندوق
              </button>
            </div>
          </div>

          <div className="grid-2" style={{ gap: 16 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label required" style={{ fontWeight: 800, marginBottom: 6 }}>
                {formData.type === 'income' ? 'بند وتصنيف الإيراد' : 'بند وتصنيف المصروف'}
              </label>
              <select
                className="form-select"
                style={{ paddingBlock: 10 }}
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                required
              >
                {(formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label required" style={{ fontWeight: 800, marginBottom: 6 }}>المبلغ بالشيقل (₪)</label>
              <input
                type="number"
                min={1}
                step="any"
                className="form-input"
                style={{ paddingBlock: 10 }}
                placeholder="مثال: 350"
                value={formData.amount || ''}
                onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div className="grid-2" style={{ gap: 16 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label required" style={{ fontWeight: 800, marginBottom: 6 }}>تاريخ الفاتورة / الحركة</label>
              <input
                type="date"
                className="form-input"
                style={{ paddingBlock: 10 }}
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, marginBottom: 6 }}>رقم الفاتورة أو السند / الوصل</label>
              <input
                type="text"
                className="form-input"
                style={{ paddingBlock: 10 }}
                placeholder="مثال: INV-1092 أو سند 45"
                value={formData.invoiceNumber}
                onChange={e => setFormData({ ...formData, invoiceNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label required" style={{ fontWeight: 800, marginBottom: 6 }}>البيان / الوصف</label>
            <input
              type="text"
              className="form-input"
              style={{ paddingBlock: 10 }}
              placeholder={formData.type === 'income' ? 'مثال: رسوم خدمات شهر 9 عن الشقق أو إيجار حاصل' : 'مثال: فاتورة صيانة المصعد الشهرية أو فاتورة الكهرباء'}
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid-2" style={{ gap: 16 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, marginBottom: 6 }}>
                {formData.type === 'income' ? 'الجهة الدافعة / المسددة' : 'الجهة المصروف لها (المستفيد / الشركة)'}
              </label>
              <input
                type="text"
                className="form-input"
                style={{ paddingBlock: 10 }}
                placeholder="مثال: شركة القدس للمصاعد، أو سكان العمارة، إلخ"
                value={formData.paidToOrReceivedFrom}
                onChange={e => setFormData({ ...formData, paidToOrReceivedFrom: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label required" style={{ fontWeight: 800, marginBottom: 6 }}>طريقة الدفع</label>
              <select
                className="form-select"
                style={{ paddingBlock: 10 }}
                value={formData.paymentMethod}
                onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
              >
                <option value="نقد">نقد (كاش)</option>
                <option value="تحويل">تحويل بنكي / إلكتروني</option>
                <option value="شيك">شيك مصرفي</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 700, marginBottom: 6 }}>رابط مرفق الفاتورة الإلكترونية أو صورة الإيصال (اختياري)</label>
            <input
              type="url"
              className="form-input"
              style={{ paddingBlock: 10 }}
              placeholder="https://... رابط صورة الفاتورة أو ملف PDF"
              value={formData.invoiceReceiptUrl}
              onChange={e => setFormData({ ...formData, invoiceReceiptUrl: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 700, marginBottom: 6 }}>ملاحظات إضافية (اختياري)</label>
            <textarea
              className="form-textarea"
              rows={2}
              style={{ padding: 10 }}
              placeholder="أي تفاصيل أو شروط أو ملاحظات حول هذه المعاملة..."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-gray-200)' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={actionLoading}
              style={{
                padding: '11px 26px',
                fontWeight: 800,
                fontSize: 14,
                background: formData.type === 'expense' ? '#DC2626' : '#059669'
              }}
            >
              {actionLoading ? 'جارٍ الحفظ...' : editingTransaction ? 'تحديث وحفظ التعديلات' : formData.type === 'income' ? '+ حفظ الإيراد' : '+ حفظ المصروف'}
            </button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" style={{ padding: '11px 22px' }}>
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Item Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingTransaction}
        title="تأكيد حذف الحركة المالية"
        message={
          deletingTransaction
            ? `هل أنت متأكد من رغبتك في حذف المعاملة:\n"${deletingTransaction.title}" بقيمة (${deletingTransaction.amount} ₪)؟\nسيتم إزالتها نهائياً من الصندوق وإعادة احتساب الأرصدة.`
            : 'هل أنت متأكد من رغبتك في حذف هذه المعاملة من صندوق العمارة؟'
        }
        confirmText="نعم، حذف المعاملة"
        type="danger"
        loading={actionLoading}
        onConfirm={handleDelete}
        onClose={() => setDeletingTransaction(null)}
      />

      {/* Clear All Temp Data Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isClearAllDialogOpen}
        title="تأكيد تصفير الصندوق وحذف السجلات"
        message="هل أنت متأكد من رغبتك في مسح وتصفير كافة السجلات الحالية من صندوق العمارة للبدء من جديد بسجلاتك الحقيقية؟\n\nتنبيه: لا يمكن التراجع عن هذه الخطوة."
        confirmText="نعم، تصفير الصندوق الآن"
        type="danger"
        loading={actionLoading}
        onConfirm={handleClearAll}
        onClose={() => setIsClearAllDialogOpen(false)}
      />
    </div>
  );
};

export default Treasury;
