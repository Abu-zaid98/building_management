import React, { useState, useEffect } from 'react';
import { getServiceCategories, getServiceItems } from '../../services/servicesCatalog';
import type { ServiceCategory, ServiceItem } from '../../types';
import {
  FiTool,
  FiCalendar,
  FiClock,
  FiPhone,
  FiCheckCircle,
  FiSearch
} from 'react-icons/fi';

const ResidentServicesView: React.FC = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('الكل');

  useEffect(() => {
    const fetchData = async () => {
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
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredServices = services.filter(item => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      (item.categoryName || '').toLowerCase().includes(search.toLowerCase());

    const matchesCat = activeCategory === 'الكل' || item.categoryId === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 28, paddingBottom: 16, borderBottom: '1px solid var(--color-gray-200)' }}>
        <div className="page-header-left">
          <h1 className="page-header-title" style={{ fontSize: 26, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>✨</span> ما نقدمه لكم من خدمات
          </h1>
          <div className="page-header-sub" style={{ fontSize: 14, color: 'var(--color-gray-600)', marginTop: 6 }}>
            دليل وجداول خطة الصيانة والنظافة والتشغيل الدوري المعتمدة من مجلس إدارة العمارة لراحتكم وسلامتكم
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
          border: '1.5px solid #BFDBFE',
          borderRadius: 'var(--radius-xl)',
          padding: '20px 24px',
          marginBottom: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          boxShadow: '0 4px 16px rgba(59, 130, 246, 0.08)'
        }}
      >
        <div style={{ fontSize: 40 }}>🏢</div>
        <div>
          <h4 style={{ margin: '0 0 6px 0', fontSize: 16, fontWeight: 800, color: '#1E40AF' }}>
            حرصنا الدائم على استدامة وراحة سكنكم
          </h4>
          <p style={{ margin: 0, fontSize: 13.5, color: '#1D4ED8', lineHeight: 1.6 }}>
            تلتزم إدارة العمارة بتقديم أعلى معايير الصيانة والتشغيل الدوري لجميع المرافق المشتركة من خلال كبرى الشركات
            المتخصصة لضمان بيئة سكنية آمنة، نظيفة ومستدامة للجميع.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px auto' }} />
          <p style={{ color: 'var(--color-gray-600)', fontSize: 15, fontWeight: 600 }}>جارٍ تحميل دليل الخدمات...</p>
        </div>
      ) : services.length === 0 ? (
        /* Empty State when no services are entered yet */
        <div
          className="card"
          style={{
            padding: '60px 30px',
            textAlign: 'center',
            borderRadius: 'var(--radius-xl)',
            border: '2px dashed var(--color-gray-300)',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
            maxWidth: 680,
            margin: '20px auto'
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 16 }}>📋</div>
          <h3 style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-gray-900)', marginBottom: 10 }}>
            لم يتم إدخال دليل الخدمات بعد
          </h3>
          <p style={{ fontSize: 14, color: 'var(--color-gray-600)', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
            تقوم إدارة العمارة حالياً بإعداد وتوثيق خطة الخدمات الدورية وجداول الصيانة الخاصة بالعمارة، وسوف تظهر هنا فور اعتمادها وإدخالها.
          </p>
        </div>
      ) : (
        <>
          {/* Category Tabs & Search */}
          <div className="card" style={{ padding: '16px 22px', marginBottom: 24, borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Categories Pills */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setActiveCategory('الكل')}
                  className={`btn btn-sm ${activeCategory === 'الكل' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px 16px', fontWeight: 700, borderRadius: 'var(--radius-md)' }}
                >
                  🌟 جميع الخدمات ({services.length})
                </button>
                {categories.map(cat => {
                  const count = services.filter(s => s.categoryId === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`btn btn-sm ${activeCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '8px 16px', fontWeight: 700, borderRadius: 'var(--radius-md)' }}
                    >
                      {cat.icon} {cat.name} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Search Input */}
              <div style={{ position: 'relative', minWidth: 240 }}>
                <FiSearch style={{ position: 'absolute', right: 12, top: 12, color: 'var(--color-gray-400)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingRight: 36, paddingBlock: 8, fontSize: 13, borderRadius: 'var(--radius-md)' }}
                  placeholder="بحث في الخدمات..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Services Grid */}
          {filteredServices.length === 0 ? (
            <div className="card" style={{ padding: '40px 20px', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
              <h4 style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-gray-800)', marginBottom: 6 }}>لا توجد خدمات مطابقة لبحثك</h4>
              <p style={{ fontSize: 13, color: 'var(--color-gray-500)', margin: 0 }}>جرب اختيار قسم آخر أو تعديل كلمة البحث</p>
            </div>
          ) : (
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
                      boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div>
                      {/* Category and Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span className="badge badge-purple" style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          {cat?.icon || '📁'} {cat?.name || service.categoryName || 'قسم عام'}
                        </span>

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
                          <FiCheckCircle size={12} style={{ marginLeft: 4 }} /> {service.status}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 style={{ margin: '6px 0 12px 0', fontSize: 18, fontWeight: 900, color: 'var(--color-gray-900)' }}>
                        {service.title}
                      </h3>

                      {/* Period badge & Next schedule */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                        <span className="badge badge-yellow" style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px' }}>
                          <FiClock size={13} /> التكرار: {service.period}
                        </span>
                        {service.nextScheduleDate && (
                          <span className="badge badge-blue" style={{ fontSize: 12, padding: '5px 12px' }}>
                            <FiCalendar size={13} /> الموعد القادم: {service.nextScheduleDate}
                          </span>
                        )}
                      </div>

                      {/* Detailed Description */}
                      <div style={{
                        background: 'var(--color-gray-50)',
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-gray-200)',
                        fontSize: 13.5,
                        color: 'var(--color-gray-800)',
                        lineHeight: 1.65,
                        marginBottom: 14
                      }}>
                        <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: 6, fontSize: 12 }}>
                          📋 ما تشمله الخدمة:
                        </strong>
                        {service.description}
                      </div>

                      {/* Provider */}
                      {service.provider && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: 12.5,
                          color: 'var(--color-gray-700)',
                          background: '#F8FAFC',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md)',
                          marginBottom: 10,
                          border: '1px solid var(--color-gray-200)'
                        }}>
                          <span><strong>الجهة المشرفة:</strong> {service.provider}</span>
                          {service.providerPhone && (
                            <span dir="ltr" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                              <FiPhone size={12} style={{ marginRight: 4 }} /> {service.providerPhone}
                            </span>
                          )}
                        </div>
                      )}

                      {service.notes && (
                        <div style={{
                          fontSize: 12,
                          color: '#92400E',
                          background: '#FEF3C7',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          marginTop: 10
                        }}>
                          💡 <strong>تنبيه للسكان:</strong> {service.notes}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ResidentServicesView;
