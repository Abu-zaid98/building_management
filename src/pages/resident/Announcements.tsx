import React, { useState, useEffect } from 'react';
import { getAnnouncements } from '../../services/announcements';
import { getResidents } from '../../services/residents';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import type { Announcement } from '../../types';
import { FiBell, FiCalendar, FiUserCheck } from 'react-icons/fi';

const ResidentAnnouncements: React.FC = () => {
  const { user } = useAuth();
  const { markAnnouncementsAsRead } = useNotifications();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const [allAnnouncements, allResidents] = await Promise.all([
          getAnnouncements(),
          getResidents()
        ]);

        const currentRes = allResidents.find(r => r.email === user?.email || r.idNumber === user?.displayName);

        const visibleAnnouncements = allAnnouncements.filter(item => {
          if (!item.targetAudience || item.targetAudience === 'الكل') return true;
          if (item.targetAudience === 'محدد') {
            if (!item.targetResidentIds || item.targetResidentIds.length === 0) return true;
            return currentRes ? item.targetResidentIds.includes(currentRes.id) : false;
          }
          return true;
        });

        setAnnouncements(visibleAnnouncements);

        // Mark all visible announcements as read immediately so notification badge clears
        if (visibleAnnouncements.length > 0) {
          markAnnouncementsAsRead(visibleAnnouncements.map(a => a.id));
        }
      } catch (error) {
        console.error('Error loading announcements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [user, markAnnouncementsAsRead]);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-header-title">📢 الإعلانات والقرارات</h1>
          <div className="page-header-sub">آخر التنبيهات والقرارات الصادرة من مجلس إدارة العمارة</div>
        </div>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 250 }}>
          <div className="loading-spinner" />
          <p>جارٍ تحميل الإعلانات...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📢</div>
            <div className="empty-state-title">لا يوجد إعلانات حالية</div>
            <div className="empty-state-sub">سيتم نشر القرارات العامة والتنبيهات الهامة هنا فور صدورها</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {announcements.map(item => (
            <div key={item.id} className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FiBell color="var(--color-primary)" size={20} />
                  <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--color-gray-900)' }}>
                    {item.title}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {item.targetAudience === 'محدد' && (
                    <span className="badge badge-purple" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiUserCheck size={12} /> مخصص لك
                    </span>
                  )}
                  <span className={`badge ${item.priority === 'عاجل' ? 'badge-red' : item.priority === 'مهم' ? 'badge-yellow' : 'badge-blue'}`}>
                    {item.priority}
                  </span>
                </div>
              </div>

              <div className="card-body">
                <p style={{ color: 'var(--color-gray-700)', fontSize: 15, lineHeight: 1.7, }}>
                  {item.content}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-gray-400)', marginTop: 14 }}>
                  <FiCalendar /> تاريخ النشر: {item.createdAt.toLocaleDateString('ar-EG')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResidentAnnouncements;
