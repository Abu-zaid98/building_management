import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getAnnouncements } from '../services/announcements';
import { getInvoices } from '../services/invoices';
import { getSuggestions } from '../services/suggestions';
import { getResidents } from '../services/residents';
import type { Announcement, Invoice, Suggestion, Resident } from '../types';

export interface AppNotification {
  id: string;
  type: 'announcement' | 'invoice' | 'suggestion' | 'payment';
  title: string;
  message: string;
  time: Date;
  link: string;
  isUrgent?: boolean;
  category: 'admin' | 'resident';
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  newSuggestionsCount: number;
  pendingInvoicesCount: number;
  newAnnouncementsCount: number;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAllAsRead: () => void;
  markAnnouncementsAsRead: (ids?: string[]) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [newSuggestionsCount, setNewSuggestionsCount] = useState(0);
  const [pendingInvoicesCount, setPendingInvoicesCount] = useState(0);
  const [newAnnouncementsCount, setNewAnnouncementsCount] = useState(0);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('read_notifications') || '[]');
    } catch {
      return [];
    }
  });

  const getReadAnnouncementsKey = useCallback(() => {
    return user ? `read_announcements_${user.uid || user.email || 'guest'}` : 'read_announcements_guest';
  }, [user]);

  const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      try {
        const saved = JSON.parse(localStorage.getItem(getReadAnnouncementsKey()) || '[]');
        setReadAnnouncementIds(saved);
      } catch {
        setReadAnnouncementIds([]);
      }
    }
  }, [user, getReadAnnouncementsKey]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setNewSuggestionsCount(0);
      setPendingInvoicesCount(0);
      setNewAnnouncementsCount(0);
      setLoading(false);
      return;
    }

    try {
      const notifs: AppNotification[] = [];

      if (user.role === 'admin') {
        // Fetch suggestions and invoices for Admin
        const [suggestionsData, invoicesData] = await Promise.all([
          getSuggestions(),
          getInvoices(),
        ]);

        const newSuggestions = suggestionsData.filter(s => s.status === 'جديد');
        setNewSuggestionsCount(newSuggestions.length);

        newSuggestions.forEach(s => {
          notifs.push({
            id: `sug_${s.id}`,
            type: 'suggestion',
            title: s.type === 'شكوى' ? '⚠️ شكوى جديدة واردة' : '💡 اقتراح جديد وارد',
            message: `من ${s.residentName || 'ساكن'} (شقة ${s.unitNumber}): ${s.title}`,
            time: s.createdAt,
            link: '/admin/suggestions',
            isUrgent: s.priority === 'حرج' || s.type === 'شكوى',
            category: 'admin',
          });
        });

        const overdueInvoices = invoicesData.filter(i => i.status === 'overdue' || i.status === 'pending');
        setPendingInvoicesCount(overdueInvoices.length);

        if (overdueInvoices.length > 0) {
          const totalOverdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);
          notifs.push({
            id: `admin_inv_pending`,
            type: 'invoice',
            title: '🧾 فواتير ومستحقات بانتظار التحصيل',
            message: `يوجد ${overdueInvoices.length} فواتير معلقة بإجمالي ${totalOverdueAmount} ₪`,
            time: new Date(),
            link: '/admin/invoices',
            isUrgent: overdueInvoices.some(i => i.status === 'overdue'),
            category: 'admin',
          });
        }
      } else if (user.role === 'resident') {
        // Fetch announcements and invoices for Resident
        const [announcementsData, residentsData, invoicesData] = await Promise.all([
          getAnnouncements(),
          getResidents(),
          getInvoices(),
        ]);

        const currentRes = residentsData.find(
          r => r.email === user.email || r.idNumber === user.displayName
        );

        // Filter visible announcements
        const visibleAnnouncements = announcementsData.filter(item => {
          if (!item.targetAudience || item.targetAudience === 'الكل') return true;
          if (item.targetAudience === 'محدد') {
            return currentRes ? (item.targetResidentIds || []).includes(currentRes.id) : false;
          }
          return true;
        });

        // Last 14 days announcements
        const now = new Date();
        const recentAnnouncements = visibleAnnouncements.filter(a => {
          const diffDays = (now.getTime() - new Date(a.createdAt).getTime()) / (1000 * 3600 * 24);
          return diffDays <= 14;
        });

        // Check read announcements from storage
        let savedReadAnnIds: string[] = [];
        try {
          savedReadAnnIds = JSON.parse(localStorage.getItem(getReadAnnouncementsKey()) || '[]');
        } catch {
          savedReadAnnIds = [];
        }

        const unreadRecent = recentAnnouncements.filter(a => !savedReadAnnIds.includes(a.id));
        setNewAnnouncementsCount(unreadRecent.length);

        recentAnnouncements.forEach(a => {
          notifs.push({
            id: `ann_${a.id}`,
            type: 'announcement',
            title: a.targetAudience === 'محدد' ? '🎯 إعلان مخصص لك من الإدارة' : '📢 إعلان جديد من إدارة العمارة',
            message: `${a.title}: ${a.content.substring(0, 70)}...`,
            time: a.createdAt,
            link: '/resident/announcements',
            isUrgent: a.priority === 'عاجل',
            category: 'resident',
          });
        });

        // Filter unpaid invoices for this resident
        if (currentRes) {
          const resInvoices = invoicesData.filter(
            i => i.residentId === currentRes.id && i.status !== 'paid'
          );
          setPendingInvoicesCount(resInvoices.length);

          resInvoices.forEach(inv => {
            notifs.push({
              id: `inv_${inv.id}`,
              type: 'invoice',
              title: inv.status === 'overdue' ? '⚠️ فاتورة متأخرة السداد' : '🧾 فاتورة خدمات جديدة بانتظار الدفع',
              message: `فاتورة شهر ${inv.period} بقيمة ${inv.amount} ₪ لشقة ${inv.unitNumber || ''}`,
              time: inv.createdAt,
              link: '/resident/invoices',
              isUrgent: inv.status === 'overdue',
              category: 'resident',
            });
          });
        }
      }

      // Sort newest first
      notifs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setNotifications(notifs);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user, getReadAnnouncementsKey]);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAnnouncementsAsRead = useCallback((ids?: string[]) => {
    try {
      const key = getReadAnnouncementsKey();
      let currentRead: string[] = [];
      try {
        currentRead = JSON.parse(localStorage.getItem(key) || '[]');
      } catch {
        currentRead = [];
      }

      let newReadList: string[];
      if (ids && ids.length > 0) {
        newReadList = Array.from(new Set([...currentRead, ...ids]));
      } else {
        // Mark all announcements in notifications as read
        const annIds = notifications.filter(n => n.type === 'announcement').map(n => n.id.replace('ann_', ''));
        newReadList = Array.from(new Set([...currentRead, ...annIds]));
      }

      localStorage.setItem(key, JSON.stringify(newReadList));
      setReadAnnouncementIds(newReadList);
      setNewAnnouncementsCount(0);

      // Also mark corresponding notif ids as read
      const notifIdsToMark = (ids && ids.length > 0)
        ? ids.map(id => `ann_${id}`)
        : notifications.filter(n => n.type === 'announcement').map(n => n.id);

      setReadNotificationIds(prev => {
        const updated = Array.from(new Set([...prev, ...notifIdsToMark]));
        try {
          localStorage.setItem('read_notifications', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    } catch (e) {
      console.error('Error marking announcements as read:', e);
    }
  }, [getReadAnnouncementsKey, notifications]);

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadNotificationIds(allIds);
    try {
      localStorage.setItem('read_notifications', JSON.stringify(allIds));
    } catch {
      // ignore
    }
    markAnnouncementsAsRead();
  };

  const unreadCount = notifications.filter(n => !readNotificationIds.includes(n.id)).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        newSuggestionsCount,
        pendingInvoicesCount,
        newAnnouncementsCount,
        loading,
        refreshNotifications: fetchNotifications,
        markAllAsRead,
        markAnnouncementsAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
