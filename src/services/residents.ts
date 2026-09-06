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
import { createResidentAccount } from './auth';
import type { Resident, ResidentFormData } from '../types';
import { updateUnit } from './units';

const RESIDENTS_COLLECTION = 'residents';

const formatResident = (id: string, data: any): Resident => ({
  id,
  fullName: data.fullName || '',
  idNumber: data.idNumber || '',
  primaryPhone: data.primaryPhone || '',
  secondaryPhone: data.secondaryPhone || '',
  email: data.email || '',
  nationality: data.nationality || 'فلسطيني',
  units: (data.units || []).map((u: any) => ({
    ...u,
    occupancyDate: u.occupancyDate instanceof Timestamp ? u.occupancyDate.toDate() : new Date(u.occupancyDate || Date.now())
  })),
  notes: data.notes || '',
  createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
  updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
});

// جلب جميع السكان
export const getResidents = async (): Promise<Resident[]> => {
  const residentsRef = collection(db, RESIDENTS_COLLECTION);
  const q = query(residentsRef, orderBy('fullName', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => formatResident(docSnap.id, docSnap.data()));
};

// جلب ساكن بـ ID
export const getResidentById = async (residentId: string): Promise<Resident | null> => {
  const residentRef = doc(db, RESIDENTS_COLLECTION, residentId);
  const snap = await getDoc(residentRef);
  if (!snap.exists()) return null;
  return formatResident(snap.id, snap.data());
};

// إضافة ساكن جديد + إنشاء حساب دخول له تلقائياً
export const addResident = async (data: ResidentFormData): Promise<string> => {
  const residentsRef = collection(db, RESIDENTS_COLLECTION);
  const email = `${data.idNumber}@building-home.com`;

  const docRef = await addDoc(residentsRef, {
    ...data,
    email,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // إنشاء حساب تسجيل الدخول في Auth للساكن بكلمة مرور افتراضية (idNumber@123)
  try {
    await createResidentAccount(data.idNumber, docRef.id, data.fullName);
  } catch (err) {
    console.warn('تنبيه: تعذر إنشاء حساب Auth للساكن تلقائياً (قد يكون موجوداً مسبقاً):', err);
  }

  // تحديث حالة الشقق المرتبطة
  for (const u of data.units) {
    await updateUnit(u.unitId, {
      status: 'مأهولة',
      currentOccupantId: docRef.id
    });
  }

  return docRef.id;
};

// تعديل بيانات ساكن
export const updateResident = async (residentId: string, data: Partial<ResidentFormData>): Promise<void> => {
  const residentRef = doc(db, RESIDENTS_COLLECTION, residentId);
  await updateDoc(residentRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });

  // إذا تم تحديث الشقق المرتبطة
  if (data.units) {
    for (const u of data.units) {
      await updateUnit(u.unitId, {
        status: 'مأهولة',
        currentOccupantId: residentId
      });
    }
  }
};

// حذف ساكن
export const deleteResident = async (residentId: string, unitsToUnassign: string[] = []): Promise<void> => {
  // تفريغ الشقق المرتبطة
  for (const unitId of unitsToUnassign) {
    await updateUnit(unitId, {
      status: 'شاغرة',
      currentOccupantId: ''
    });
  }

  const residentRef = doc(db, RESIDENTS_COLLECTION, residentId);
  await deleteDoc(residentRef);
};
