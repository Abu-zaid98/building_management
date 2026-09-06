import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { Unit, UnitFormData } from '../types';

const UNITS_COLLECTION = 'units';

// تحويل بيانات Firestore إلى نوع Unit
const formatUnit = (id: string, data: any): Unit => {
  const floor = data.floor !== undefined && data.floor !== null ? Number(data.floor) : 1;
  const unitCategory = data.unitCategory || (floor === 0 ? 'حاصل' : 'شقة');

  return {
    id,
    unitNumber: data.unitNumber || '',
    unitCategory,
    floor,
    direction: data.direction || 'شمال',
    area: Number(data.area) || 0,
    type: data.type || 'ملك',
    ownerInfo: data.ownerInfo || undefined,
    leaseInfo: data.leaseInfo || undefined,
    currentOccupantId: data.currentOccupantId || undefined,
    servicesFee: Number(data.servicesFee) || 0,
    status: data.status || 'شاغرة',
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
  };
};

// جلب جميع الشقق والوحدات
export const getUnits = async (): Promise<Unit[]> => {
  const unitsRef = collection(db, UNITS_COLLECTION);
  const q = query(unitsRef, orderBy('unitNumber', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => formatUnit(docSnap.id, docSnap.data()));
};

// جلب شقة بـ ID
export const getUnitById = async (unitId: string): Promise<Unit | null> => {
  const unitRef = doc(db, UNITS_COLLECTION, unitId);
  const snap = await getDoc(unitRef);
  if (!snap.exists()) return null;
  return formatUnit(snap.id, snap.data());
};

// إضافة شقة أو حاصل جديد
export const addUnit = async (data: UnitFormData): Promise<string> => {
  const unitsRef = collection(db, UNITS_COLLECTION);
  const floor = data.floor !== undefined && data.floor !== null ? Number(data.floor) : 0;
  const unitCategory = data.unitCategory || (floor === 0 ? 'حاصل' : 'شقة');

  const docRef = await addDoc(unitsRef, {
    ...data,
    unitCategory,
    floor,
    area: Number(data.area) || 0,
    servicesFee: Number(data.servicesFee) || 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

// تعديل شقة أو حاصل
export const updateUnit = async (unitId: string, data: Partial<UnitFormData>): Promise<void> => {
  const unitRef = doc(db, UNITS_COLLECTION, unitId);
  const payload: any = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  if (data.floor !== undefined && data.floor !== null) {
    payload.floor = Number(data.floor);
  }
  if (data.unitCategory !== undefined) {
    payload.unitCategory = data.unitCategory;
  }
  if (data.area !== undefined) {
    payload.area = Number(data.area);
  }
  if (data.servicesFee !== undefined) {
    payload.servicesFee = Number(data.servicesFee);
  }

  await updateDoc(unitRef, payload);
};

// حذف شقة
export const deleteUnit = async (unitId: string): Promise<void> => {
  const unitRef = doc(db, UNITS_COLLECTION, unitId);
  await deleteDoc(unitRef);
};
