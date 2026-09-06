import React, { useState, useEffect } from 'react';
import {
  getServiceCategories,
  getServiceItems,
  addServiceCategory,
  deleteServiceCategory,
  addServiceItem,
  updateServiceItem,
  deleteServiceItem,
} from '../../services/servicesCatalog';
import type {
  ServiceCategory,
  ServiceItem,
  ServiceItemFormData,
  ServicePeriod,
  ServiceStatus
} from '../../types';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiTool,
  FiCalendar,
  FiPhone,
  FiCheckCircle,
  FiFolderPlus,
  FiLayers,
  FiSearch,
  FiClock,
  FiInfo,
  FiFolder
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const PERIOD_OPTIONS: ServicePeriod[] = [
  'يومياً',
  'أسبوعياً',
  'شهرياً',
  'كل شهرين',
  'كل 3 أشهر',
  'نصف سنوي',
  'سنوياً',
  'عند الطلب / طوارئ',
];

const STATUS_OPTIONS: ServiceStatus[] = [
  'نشط ومستمر',
  'مجدول قريباً',
  'مكتمل لهذه الفترة',
  'متوقف مؤقتاً',
];

const ServicesManager: React.FC = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('الكل');
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<string>('الكل');

  // Modals
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Service Form State
  const [serviceFormData, setServiceFormData] = useState<ServiceItemFormData>({
    categoryId: '',
    categoryName: '',
    title: '',
    period: 'شهرياً',
    description: '',
    provider: '',
    providerPhone: '',
    status: 'نشط ومستمر',
    nextScheduleDate: '',
    notes: '',
  });

  // Category Form State
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catIcon, setCatIcon] = useState('🛠️');

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, items] = await Promise.all([
        getServiceCategories(),
        getServiceItems(),
      ]);
      setCategories(cats);
      setServices(items);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء تحميل بيانات الخدمات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddServiceModal = () => {
    if (categories.length === 0) {
      toast.error('يرجى إضافة قسم رئيسي أولاً قبل إضافة الخدمات');
      setIsCategoryModalOpen(true);
      return;
    }
    setEditingService(null);
    setServiceFormData({
      categoryId: categories[0]?.id || '',
      categoryName: categories[0]?.name || '',
      title: '',
      period: 'شهرياً',
      description: '',
      provider: '',
      providerPhone: '',
      status: 'نشط ومستمر',
      nextScheduleDate: '',
      notes: '',
    });
    setIsServiceModalOpen(true);
  };

  const openEditServiceModal = (item: ServiceItem) => {
    setEditingService(item);
    setServiceFormData({
      categoryId: item.categoryId,
      categoryName: item.categoryName || '',
      title: item.title,
      period: item.period,
      description: item.description,
      provider: item.provider || '',
      providerPhone: item.providerPhone || '',
      status: item.status,
      nextScheduleDate: item.nextScheduleDate || '',
      notes: item.notes || '',
    });
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceFormData.title.trim()) {
      toast.error('يرجى كتابة اسم الخدمة');
      return;
    }
    if (!serviceFormData.categoryId) {
      toast.error('يرجى تحديد القسم الرئيسي للخدمة');
      return;
    }

    try {
      setActionLoading(true);
      const chosenCat = categories.find(c => c.id === serviceFormData.categoryId);
      const payload: ServiceItemFormData = {
        ...serviceFormData,
        categoryName: chosenCat?.name || '',
      };

      if (editingService) {
        await updateServiceItem(editingService.id, payload);
        toast.success('تم تحديث الخدمة بنجاح 🛠️');
      } else {
        await addServiceItem(payload);
        toast.success('تمت إضافة الخدمة بنجاح 🎉');
      }

      setIsServiceModalOpen(false);
      setEditingService(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('تعذر حفظ الخدمة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteService = async () => {
    if (!deletingServiceId) return;
    try {
      setActionLoading(true);
      await deleteServiceItem(deletingServiceId);
      toast.success('تم حذف الخدمة بنجاح');
      setDeletingServiceId(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('تعذر حذف الخدمة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      toast.error('يرجى كتابة اسم القسم الرئيسي');
      return;
    }

    try {
      setActionLoading(true);
      await addServiceCategory(catName.trim(), catDesc.trim(), catIcon);
      toast.success('تمت إضافة القسم الرئيسي بنجاح 📁');
      setCatName('');
      setCatDesc('');
      setIsCategoryModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('تعذر إضافة القسم');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategoryId) return;
    try {
      setActionLoading(true);
      await deleteServiceCategory(deletingCategoryId);
      toast.success('تم حذف القسم الرئيسي');
      setDeletingCategoryId(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('تعذر حذف القسم');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered services
  const filteredServices = services.filter(item => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      (item.provider || '').toLowerCase().includes(search.toLowerCase());

    const matchesCat = selectedCategoryFilter === 'الكل' || item.categoryId === selectedCategoryFilter;
    const matchesPeriod = selectedPeriodFilter === 'الكل' || item.period === selectedPeriodFilter;

    return matchesSearch && matchesCat && matchesPeriod;
  });

  const activeCount = services.filter(s => s.status === 'نشط ومستمر').length;
  const upcomingCount = services.filter(s => s.status === 'مجدول قريباً').length;

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 28, paddingBottom: 16, borderBottom: '1px solid var(--color-gray-200)' }}>
        <div className="page-header-left">
          <h1 className="page-header-title" style={{ fontSize: 26, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>🛠️</span> دليل وخطة الخدمات الدورية للسكان
          </h1>
          <div className="page-header-sub" style={{ fontSize: 14, color: 'var(--color-gray-600)', marginTop: 6 }}>
            توثيق وتخطيط ما تقدمه إدارة العمارة من خدمات وصيانة دورية للسكان مقسمة إلى أقسام رئيسية وفرعية
          </div>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="btn btn-secondary"
            style={{ padding: '10px 18px', fontWeight: 700, borderRadius: 'var(--radius-md)' }}
          >
            <FiFolderPlus size={18} /> إدارة الأقسام الرئيسية ({categories.length})
          </button>
          <button
            onClick={openAddServiceModal}
            className="btn btn-primary"
            style={{ padding: '10px 20px', fontWeight: 700, borderRadius: 'var(--radius-md)' }}
          >
            <FiPlus size={18} /> إضافة خدمة دورية جديدة
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px auto' }} />
          <p style={{ color: 'var(--color-gray-600)', fontSize: 15, fontWeight: 600 }}>جارٍ تحميل بيانات الخدمات...</p>
        </div>
      ) : categories.length === 0 ? (
        /* Empty state when NO categories exist */
        <div
          className="card"
          style={{
            padding: '60px 30px',
            textAlign: 'center',
            borderRadius: 'var(--radius-xl)',
            border: '2px dashed var(--color-gray-300)',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            maxWidth: 720,
            margin: '40px auto'
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 16 }}>🗂️</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-gray-900)', marginBottom: 10 }}>
            لم يتم إدخال أي أقسام رئيسية للخدمات بعد
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-gray-600)', maxWidth: 520, margin: '0 auto 24px auto', lineHeight: 1.7 }}>
            لتنظيم وتوثيق ما تقدمه الإدارة للسكان، ابدأ بإضافة أول قسم رئيسي (مثل: <strong>صيانة وتشغيل المرافق</strong>، <strong>النظافة والبيئة</strong>، أو <strong>الأمن والسلامة</strong>).
          </p>
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="btn btn-primary"
            style={{ padding: '12px 28px', fontSize: 15, fontWeight: 800, borderRadius: 'var(--radius-md)' }}
          >
            <FiPlus size={18} /> إضافة أول قسم رئيسي الآن
          </button>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="stats-grid" style={{ marginBottom: 28, gap: 18 }}>
            <div className="stat-card" style={{ padding: '20px 22px', borderRadius: 'var(--radius-lg)' }}>
              <div className="stat-icon" style={{ background: '#EEF2FF', color: '#4F46E5', width: 50, height: 50, borderRadius: 12 }}>
                <FiLayers size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value" style={{ fontSize: 26, fontWeight: 900 }}>{categories.length}</div>
                <div className="stat-label" style={{ fontSize: 13, color: 'var(--color-gray-600)' }}>الأقسام الرئيسية</div>
              </div>
            </div>

            <div className="stat-card" style={{ padding: '20px 22px', borderRadius: 'var(--radius-lg)' }}>
              <div className="stat-icon" style={{ background: '#F0FDF4', color: '#16A34A', width: 50, height: 50, borderRadius: 12 }}>
                <FiTool size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value" style={{ fontSize: 26, fontWeight: 900 }}>{services.length}</div>
                <div className="stat-label" style={{ fontSize: 13, color: 'var(--color-gray-600)' }}>إجمالي الخدمات المسجلة</div>
              </div>
            </div>

            <div className="stat-card" style={{ padding: '20px 22px', borderRadius: 'var(--radius-lg)' }}>
              <div className="stat-icon" style={{ background: '#ECFDF5', color: '#059669', width: 50, height: 50, borderRadius: 12 }}>
                <FiCheckCircle size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value" style={{ fontSize: 26, fontWeight: 900 }}>{activeCount}</div>
                <div className="stat-label" style={{ fontSize: 13, color: 'var(--color-gray-600)' }}>خدمات مستمرة ونشطة</div>
              </div>
            </div>

            <div className="stat-card" style={{ padding: '20px 22px', borderRadius: 'var(--radius-lg)' }}>
              <div className="stat-icon" style={{ background: '#EFF6FF', color: '#2563EB', width: 50, height: 50, borderRadius: 12 }}>
                <FiClock size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value" style={{ fontSize: 26, fontWeight: 900 }}>{upcomingCount}</div>
                <div className="stat-label" style={{ fontSize: 13, color: 'var(--color-gray-600)' }}>خدمات مجدولة قريباً</div>
              </div>
            </div>
          </div>

          {/* If categories exist, but NO services exist yet */}
          {services.length === 0 ? (
            <div
              className="card"
              style={{
                padding: '50px 30px',
                textAlign: 'center',
                borderRadius: 'var(--radius-xl)',
                border: '1.5px dashed var(--color-gray-300)',
                background: '#FFFFFF',
                maxWidth: 680,
                margin: '20px auto'
              }}
            >
              <div style={{ fontSize: 50, marginBottom: 14 }}>🛠️</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-gray-900)', marginBottom: 8 }}>
                لم يتم إدخال أي خدمات دورية تابعة للأقسام بعد
              </h3>
              <p style={{ fontSize: 14, color: 'var(--color-gray-600)', maxWidth: 480, margin: '0 auto 20px auto', lineHeight: 1.6 }}>
                لديك {categories.length} أقسام رئيسية جاهزة. يمكنك الآن إضافة أول خدمة دورية (مثل: صيانة المصعد الشهرية، تنظيف الخزانات، أو إنارة المداخل) وتحديد دوريتها للسكان.
              </p>
              <button
                onClick={openAddServiceModal}
                className="btn btn-primary"
                style={{ padding: '12px 24px', fontWeight: 800, borderRadius: 'var(--radius-md)' }}
              >
                <FiPlus size={18} /> إضافة أول خدمة دورية
              </button>
            </div>
          ) : (
            <>
              {/* Filter and Search Bar */}
              <div className="card" style={{ padding: '18px 24px', marginBottom: 24, borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ flex: '1 1 240px', position: 'relative' }}>
                    <FiSearch style={{ position: 'absolute', right: 14, top: 13, color: 'var(--color-gray-400)' }} />
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingRight: 38, paddingBlock: 10, fontSize: 14, borderRadius: 'var(--radius-md)' }}
                      placeholder="بحث في اسم الخدمة، الوصف، أو الجهة المنفذة..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>

                  <div style={{ minWidth: 220 }}>
                    <select
                      className="form-select"
                      style={{ paddingBlock: 10, fontSize: 14, borderRadius: 'var(--radius-md)' }}
                      value={selectedCategoryFilter}
                      onChange={e => setSelectedCategoryFilter(e.target.value)}
                    >
                      <option value="الكل">📁 كل الأقسام الرئيسية ({categories.length})</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.icon} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ minWidth: 170 }}>
                    <select
                      className="form-select"
                      style={{ paddingBlock: 10, fontSize: 14, borderRadius: 'var(--radius-md)' }}
                      value={selectedPeriodFilter}
                      onChange={e => setSelectedPeriodFilter(e.target.value)}
                    >
                      <option value="الكل">⏱️ كل الدوريات</option>
                      {PERIOD_OPTIONS.map(p => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Filtered empty state */}
              {filteredServices.length === 0 ? (
                <div className="card" style={{ padding: '40px 20px', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
                  <h4 style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-gray-800)', marginBottom: 6 }}>لا توجد خدمات مطابقة للبحث</h4>
                  <p style={{ fontSize: 13, color: 'var(--color-gray-500)', margin: 0 }}>جرب تغيير عبارة البحث أو الفلتر المختار</p>
                </div>
              ) : (
                /* Services Cards Grid */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
                  {filteredServices.map(service => {
                    const cat = categories.find(c => c.id === service.categoryId);
                    return (
                      <div
                        key={service.id}
                        className="card"
                        style={{
                          padding: '24px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          borderRadius: 'var(--radius-lg)',
                          borderTop: '4px solid var(--color-primary)',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                      >
                        <div>
                          {/* Card Top */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                            <div>
                              <span
                                className="badge badge-purple"
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  padding: '4px 10px',
                                  marginBottom: 8,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6
                                }}
                              >
                                {cat?.icon || '📁'} {cat?.name || service.categoryName || 'قسم عام'}
                              </span>
                              <h3 style={{ margin: '4px 0 0 0', fontSize: 17, fontWeight: 900, color: 'var(--color-gray-900)' }}>
                                {service.title}
                              </h3>
                            </div>

                            <span
                              className={`badge ${
                                service.status === 'نشط ومستمر'
                                  ? 'badge-green'
                                  : service.status === 'مجدول قريباً'
                                  ? 'badge-blue'
                                  : service.status === 'مكتمل لهذه الفترة'
                                  ? 'badge-gray'
                                  : 'badge-yellow'
                              }`}
                              style={{ padding: '5px 12px', fontSize: 12, fontWeight: 700 }}
                            >
                              {service.status}
                            </span>
                          </div>

                          {/* Period Badge */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                            <span className="badge badge-yellow" style={{ fontSize: 12, fontWeight: 700, padding: '5px 10px' }}>
                              <FiClock size={13} /> الدورية: {service.period}
                            </span>
                            {service.nextScheduleDate && (
                              <span className="badge badge-blue" style={{ fontSize: 12, padding: '5px 10px' }}>
                                <FiCalendar size={13} /> الموعد القادم: {service.nextScheduleDate}
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          <div style={{
                            background: 'var(--color-gray-50)',
                            padding: '12px 14px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-gray-200)',
                            marginBottom: 14,
                          }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-gray-500)', marginBottom: 4 }}>
                              تفاصيل وتغطية الخدمة:
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--color-gray-800)', lineHeight: 1.6, margin: 0 }}>
                              {service.description}
                            </p>
                          </div>

                          {/* Provider Info */}
                          {service.provider && (
                            <div style={{
                              background: '#F8FAFC',
                              padding: '10px 14px',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--color-gray-200)',
                              fontSize: 12,
                              color: 'var(--color-gray-700)',
                              marginBottom: 12,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}>
                              <span><strong>الجهة المنفذة:</strong> {service.provider}</span>
                              {service.providerPhone && (
                                <a href={`tel:${service.providerPhone}`} style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4, direction: 'ltr', fontWeight: 700 }}>
                                  <FiPhone size={13} /> {service.providerPhone}
                                </a>
                              )}
                            </div>
                          )}

                          {service.notes && (
                            <div style={{ fontSize: 12, color: '#92400E', background: '#FEF3C7', padding: '8px 12px', borderRadius: 'var(--radius-md)', marginBottom: 12 }}>
                              💡 <strong>ملاحظة:</strong> {service.notes}
                            </div>
                          )}
                        </div>

                        {/* Card Actions */}
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid var(--color-gray-200)', paddingTop: 14, marginTop: 10 }}>
                          <button
                            onClick={() => openEditServiceModal(service)}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '6px 14px', fontWeight: 700 }}
                          >
                            <FiEdit2 /> تعديل
                          </button>
                          <button
                            onClick={() => setDeletingServiceId(service.id)}
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--color-danger)', padding: '6px 14px', fontWeight: 700 }}
                          >
                            <FiTrash2 /> حذف
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Add / Edit Service Modal */}
      <Modal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        title={editingService ? '✏️ تعديل خدمة دورية' : '➕ إضافة خدمة دورية جديدة'}
      >
        <form onSubmit={handleSaveService} style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '4px 0' }}>
          <div className="grid-2" style={{ gap: 16 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label required" style={{ fontWeight: 800, marginBottom: 6 }}>القسم الرئيسي</label>
              <select
                className="form-select"
                style={{ paddingBlock: 10 }}
                value={serviceFormData.categoryId}
                onChange={e => setServiceFormData({ ...serviceFormData, categoryId: e.target.value })}
                required
              >
                <option value="">اختر القسم الرئيسي...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label required" style={{ fontWeight: 800, marginBottom: 6 }}>اسم الخدمة (القسم الفرعي)</label>
              <input
                type="text"
                className="form-input"
                style={{ paddingBlock: 10 }}
                placeholder="مثال: صيانة المصعد الشهرية، تنظيف الخزانات"
                value={serviceFormData.title}
                onChange={e => setServiceFormData({ ...serviceFormData, title: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid-2" style={{ gap: 16 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label required" style={{ fontWeight: 800, marginBottom: 6 }}>دورية تقديم الخدمة</label>
              <select
                className="form-select"
                style={{ paddingBlock: 10 }}
                value={serviceFormData.period}
                onChange={e => setServiceFormData({ ...serviceFormData, period: e.target.value as ServicePeriod })}
                required
              >
                {PERIOD_OPTIONS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label required" style={{ fontWeight: 800, marginBottom: 6 }}>حالة الخدمة</label>
              <select
                className="form-select"
                style={{ paddingBlock: 10 }}
                value={serviceFormData.status}
                onChange={e => setServiceFormData({ ...serviceFormData, status: e.target.value as ServiceStatus })}
                required
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label required" style={{ fontWeight: 800, marginBottom: 6 }}>تفاصيل وما تشمله الخدمة المقدمة للسكان</label>
            <textarea
              className="form-textarea"
              rows={3}
              style={{ padding: 12 }}
              placeholder="اكتب تفاصيل واضحة عمّا تشمله هذه الخدمة ومواصفاتها حتى يكون الساكن على علم بما تقدمه الإدارة..."
              value={serviceFormData.description}
              onChange={e => setServiceFormData({ ...serviceFormData, description: e.target.value })}
              required
            />
          </div>

          <div className="grid-3" style={{ gap: 14 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, marginBottom: 6 }}>الجهة المنفذة / الشركة</label>
              <input
                type="text"
                className="form-input"
                style={{ paddingBlock: 10 }}
                placeholder="اسم الشركة أو الفني"
                value={serviceFormData.provider}
                onChange={e => setServiceFormData({ ...serviceFormData, provider: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, marginBottom: 6 }}>هاتف التواصل للجهة</label>
              <input
                type="tel"
                className="form-input"
                style={{ paddingBlock: 10 }}
                placeholder="059xxxxxxx"
                value={serviceFormData.providerPhone}
                onChange={e => setServiceFormData({ ...serviceFormData, providerPhone: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, marginBottom: 6 }}>تاريخ الموعد القادم</label>
              <input
                type="date"
                className="form-input"
                style={{ paddingBlock: 10 }}
                value={serviceFormData.nextScheduleDate}
                onChange={e => setServiceFormData({ ...serviceFormData, nextScheduleDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 700, marginBottom: 6 }}>ملاحظات أو تنويهات للسكان (اختياري)</label>
            <input
              type="text"
              className="form-input"
              style={{ paddingBlock: 10 }}
              placeholder="مثال: يرجى إغلاق المحابس قبل الموعد، أو ملصق الفحص موجود داخل المصعد"
              value={serviceFormData.notes}
              onChange={e => setServiceFormData({ ...serviceFormData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-gray-200)' }}>
            <button type="submit" className="btn btn-primary" disabled={actionLoading} style={{ padding: '10px 24px', fontWeight: 800 }}>
              {actionLoading ? 'جارٍ الحفظ...' : editingService ? 'تحديث الخدمة' : 'إضافة الخدمة'}
            </button>
            <button type="button" onClick={() => setIsServiceModalOpen(false)} className="btn btn-secondary" style={{ padding: '10px 20px' }}>
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      {/* Manage Categories Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="📁 إدارة الأقسام الرئيسية للخدمات"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* List of existing categories */}
          <div>
            <label className="form-label" style={{ fontWeight: 800, marginBottom: 10 }}>الأقسام المسجلة حالياً:</label>
            {categories.length === 0 ? (
              <div style={{ padding: '24px', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--color-gray-500)', fontSize: 13 }}>
                لا توجد أقسام رئيسية بعد. أضف أول قسم أدناه للبدء.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {categories.map(cat => (
                  <div
                    key={cat.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: 'var(--color-gray-50)',
                      border: '1px solid var(--color-gray-200)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 24 }}>{cat.icon || '📁'}</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--color-gray-900)' }}>{cat.name}</div>
                        {cat.description && <div style={{ fontSize: 12, color: 'var(--color-gray-500)', marginTop: 2 }}>{cat.description}</div>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeletingCategoryId(cat.id)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--color-danger)', padding: '6px 10px' }}
                      title="حذف القسم"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add new category form */}
          <form onSubmit={handleCreateCategory} style={{
            background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
            padding: 20,
            borderRadius: 'var(--radius-lg)',
            border: '1.5px solid var(--color-gray-200)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiFolder size={18} /> إضافة قسم رئيسي جديد
            </h4>

            <div className="grid-2" style={{ gap: 14 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label required" style={{ fontWeight: 800, marginBottom: 6 }}>اسم القسم</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingBlock: 10 }}
                  placeholder="مثال: صيانة وتشغيل المرافق"
                  value={catName}
                  onChange={e => setCatName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 800, marginBottom: 6 }}>أيقونة القسم</label>
                <select
                  className="form-select"
                  style={{ paddingBlock: 10 }}
                  value={catIcon}
                  onChange={e => setCatIcon(e.target.value)}
                >
                  <option value="⚙️">⚙️ صيانة ومعدات</option>
                  <option value="🧹">🧹 نظافة وبيئة</option>
                  <option value="🛡️">🛡️ أمن وسلامة</option>
                  <option value="💧">💧 مياه وخزانات</option>
                  <option value="⚡">⚡ كهرباء وإنارة</option>
                  <option value="🌱">🌱 حدائق ومساحات خضراء</option>
                  <option value="🚗">🚗 مواقف وبوابات</option>
                  <option value="🌦️">🌦️ خدمات موسمية</option>
                  <option value="🏢">🏢 مرافق عامة</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, marginBottom: 6 }}>وصف القسم (اختياري)</label>
              <input
                type="text"
                className="form-input"
                style={{ paddingBlock: 10 }}
                placeholder="شرح مختصر لمجال هذا القسم..."
                value={catDesc}
                onChange={e => setCatDesc(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={actionLoading}
              style={{ alignSelf: 'flex-start', padding: '10px 24px', fontWeight: 800 }}
            >
              {actionLoading ? 'جارٍ الإضافة...' : '+ حفظ القسم'}
            </button>
          </form>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10, borderTop: '1px solid var(--color-gray-200)' }}>
            <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="btn btn-secondary" style={{ padding: '8px 22px' }}>
              إغلاق
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Service Dialog */}
      <ConfirmDialog
        isOpen={!!deletingServiceId}
        title="تأكيد حذف الخدمة"
        message="هل أنت متأكد من رغبتك في حذف هذه الخدمة من دليل خدمات العمارة؟"
        confirmText="نعم، حذف"
        type="danger"
        loading={actionLoading}
        onConfirm={handleDeleteService}
        onClose={() => setDeletingServiceId(null)}
      />

      {/* Delete Category Dialog */}
      <ConfirmDialog
        isOpen={!!deletingCategoryId}
        title="تأكيد حذف القسم الرئيسي"
        message="هل أنت متأكد من حذف هذا القسم؟ لن يتم حذف الخدمات المرتبطة به تلقائياً ولكن سيتم تحويلها إلى بدون تصنيف."
        confirmText="نعم، حذف القسم"
        type="danger"
        loading={actionLoading}
        onConfirm={handleDeleteCategory}
        onClose={() => setDeletingCategoryId(null)}
      />
    </div>
  );
};

export default ServicesManager;
