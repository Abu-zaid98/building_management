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
import type { ServiceCategory, ServiceItem, ServiceItemFormData } from '../types';

const CATEGORIES_COLLECTION = 'service_categories';
const SERVICES_COLLECTION = 'service_items';

// Helper formatting category
const formatCategory = (id: string, data: any): ServiceCategory => ({
  id,
  name: data.name || '',
  description: data.description || '',
  icon: data.icon || '📁',
  order: Number(data.order) || 0,
  createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
});

// Helper formatting service item
const formatServiceItem = (id: string, data: any): ServiceItem => ({
  id,
  categoryId: data.categoryId || '',
  categoryName: data.categoryName || '',
  title: data.title || '',
  period: data.period || 'شهرياً',
  description: data.description || '',
  provider: data.provider || '',
  providerPhone: data.providerPhone || '',
  status: data.status || 'نشط ومستمر',
  nextScheduleDate: data.nextScheduleDate || '',
  notes: data.notes || '',
  createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
  updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
});

// جلب جميع الأقسام الرئيسية - بدون أي بيانات وهمية
export const getServiceCategories = async (): Promise<ServiceCategory[]> => {
  try {
    const catRef = collection(db, CATEGORIES_COLLECTION);
    const q = query(catRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(d => formatCategory(d.id, d.data()));
  } catch (error) {
    console.error('Error fetching service categories:', error);
    return [];
  }
};

// إضافة قسم رئيسي جديد
export const addServiceCategory = async (name: string, description = '', icon = '📁'): Promise<string> => {
  const catRef = collection(db, CATEGORIES_COLLECTION);
  const existing = await getDocs(catRef);
  const order = existing.size + 1;
  const docRef = await addDoc(catRef, {
    name,
    description,
    icon,
    order,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

// تعديل قسم رئيسي
export const updateServiceCategory = async (id: string, data: Partial<ServiceCategory>): Promise<void> => {
  const docRef = doc(db, CATEGORIES_COLLECTION, id);
  await updateDoc(docRef, { ...data });
};

// حذف قسم رئيسي
export const deleteServiceCategory = async (id: string): Promise<void> => {
  const docRef = doc(db, CATEGORIES_COLLECTION, id);
  await deleteDoc(docRef);
};

// جلب جميع الخدمات (الأقسام الفرعية) - بدون أي بيانات وهمية
export const getServiceItems = async (): Promise<ServiceItem[]> => {
  try {
    const sRef = collection(db, SERVICES_COLLECTION);
    const q = query(sRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(d => formatServiceItem(d.id, d.data()));
  } catch (error) {
    console.error('Error fetching service items:', error);
    return [];
  }
};

// إضافة خدمة جديدة (قسم فرعي)
export const addServiceItem = async (data: ServiceItemFormData): Promise<string> => {
  const sRef = collection(db, SERVICES_COLLECTION);
  const docRef = await addDoc(sRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

// تعديل خدمة
export const updateServiceItem = async (id: string, data: Partial<ServiceItemFormData>): Promise<void> => {
  const docRef = doc(db, SERVICES_COLLECTION, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// حذف خدمة
export const deleteServiceItem = async (id: string): Promise<void> => {
  const docRef = doc(db, SERVICES_COLLECTION, id);
  await deleteDoc(docRef);
};
