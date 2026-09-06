import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { Suggestion, SuggestionFormData, SuggestionStatus } from '../types';

const SUGGESTIONS_COLLECTION = 'suggestions';

const formatSuggestion = (id: string, data: any): Suggestion => ({
  id,
  residentId: data.residentId || '',
  residentName: data.residentName || 'ساكن',
  unitId: data.unitId || '',
  unitNumber: data.unitNumber || '',
  type: data.type || 'اقتراح',
  title: data.title || '',
  description: data.description || '',
  priority: data.priority || 'عادي',
  status: (data.status as SuggestionStatus) || 'جديد',
  readAt: data.readAt instanceof Timestamp ? data.readAt.toDate() : undefined,
  adminNotes: data.adminNotes || '',
  createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
});

// جلب جميع الاقتراحات والشكاوى (للأدمن)
export const getSuggestions = async (): Promise<Suggestion[]> => {
  const ref = collection(db, SUGGESTIONS_COLLECTION);
  const q = query(ref, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => formatSuggestion(d.id, d.data()));
};

// جلب اقتراحات ساكن معين
export const getSuggestionsByResident = async (residentId: string): Promise<Suggestion[]> => {
  const ref = collection(db, SUGGESTIONS_COLLECTION);
  const q = query(ref, where('residentId', '==', residentId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => formatSuggestion(d.id, d.data()));
};

// تقديم اقتراح / شكوى جديدة من الساكن
export const submitSuggestion = async (
  data: SuggestionFormData,
  residentId: string,
  residentName: string,
  unitId: string,
  unitNumber: string
): Promise<string> => {
  const ref = collection(db, SUGGESTIONS_COLLECTION);
  const docRef = await addDoc(ref, {
    ...data,
    residentId,
    residentName,
    unitId,
    unitNumber,
    status: 'جديد',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

// تحديث حالة الاقتراح وإضافة ملاحظات الأدمن
export const updateSuggestionStatus = async (
  id: string,
  status: SuggestionStatus,
  adminNotes?: string
): Promise<void> => {
  const ref = doc(db, SUGGESTIONS_COLLECTION, id);
  await updateDoc(ref, {
    status,
    ...(adminNotes !== undefined && { adminNotes }),
    ...(status === 'مقروء' && { readAt: new Date() }),
  });
};

// حذف اقتراح
export const deleteSuggestion = async (id: string): Promise<void> => {
  const ref = doc(db, SUGGESTIONS_COLLECTION, id);
  await deleteDoc(ref);
};
