import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { Announcement, AnnouncementFormData } from '../types';

const ANNOUNCEMENTS_COLLECTION = 'announcements';

const formatAnnouncement = (id: string, data: any): Announcement => ({
  id,
  title: data.title || '',
  content: data.content || '',
  priority: data.priority || 'عادي',
  createdBy: data.createdBy || '',
  targetAudience: data.targetAudience || 'الكل',
  targetResidentIds: data.targetResidentIds || [],
  targetResidentNames: data.targetResidentNames || [],
  createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
});

// جلب جميع الإعلانات
export const getAnnouncements = async (): Promise<Announcement[]> => {
  const ref = collection(db, ANNOUNCEMENTS_COLLECTION);
  const q = query(ref, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => formatAnnouncement(d.id, d.data()));
};

// إنشاء إعلان جديد
export const createAnnouncement = async (
  data: AnnouncementFormData,
  createdByUid: string
): Promise<string> => {
  const ref = collection(db, ANNOUNCEMENTS_COLLECTION);
  const docRef = await addDoc(ref, {
    ...data,
    createdBy: createdByUid,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

// تعديل إعلان
export const updateAnnouncement = async (
  id: string,
  data: Partial<AnnouncementFormData>
): Promise<void> => {
  const ref = doc(db, ANNOUNCEMENTS_COLLECTION, id);
  await updateDoc(ref, data);
};

// حذف إعلان
export const deleteAnnouncement = async (id: string): Promise<void> => {
  const ref = doc(db, ANNOUNCEMENTS_COLLECTION, id);
  await deleteDoc(ref);
};
