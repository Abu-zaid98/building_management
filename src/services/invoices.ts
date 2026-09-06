import {
  collection,
  doc,
  getDocs,
  getDoc,
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
import type { Invoice, InvoiceFormData, InvoiceStatus } from '../types';
import { getUnits } from './units';
import { getResidents } from './residents';

const INVOICES_COLLECTION = 'invoices';

const formatInvoice = (id: string, data: any): Invoice => ({
  id,
  unitId: data.unitId || '',
  unitNumber: data.unitNumber || '',
  unitCategory: data.unitCategory || undefined,
  residentId: data.residentId || '',
  residentName: data.residentName || '',
  period: data.period || '',
  amount: Number(data.amount) || 0,
  breakdown: data.breakdown || { servicesFee: 0 },
  dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : new Date(data.dueDate || Date.now()),
  status: (data.status as InvoiceStatus) || 'pending',
  paidDate: data.paidDate instanceof Timestamp ? data.paidDate.toDate() : data.paidDate ? new Date(data.paidDate) : undefined,
  createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
});

// جلب جميع الفواتير
export const getInvoices = async (): Promise<Invoice[]> => {
  const invoicesRef = collection(db, INVOICES_COLLECTION);
  const q = query(invoicesRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => formatInvoice(docSnap.id, docSnap.data()));
};

// جلب فواتير ساكن معين
export const getInvoicesByResident = async (residentId: string): Promise<Invoice[]> => {
  const invoicesRef = collection(db, INVOICES_COLLECTION);
  const q = query(invoicesRef, where('residentId', '==', residentId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => formatInvoice(docSnap.id, docSnap.data()));
};

// إنشاء فاتورة جديدة
export const createInvoice = async (data: InvoiceFormData): Promise<string> => {
  const invoicesRef = collection(db, INVOICES_COLLECTION);
  const docRef = await addDoc(invoicesRef, {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

// توليد فواتير شهرية جماعية لجميع الشقق والحواصل المأهولة
export const generateMonthlyInvoices = async (period: string, dueDate: Date): Promise<number> => {
  const units = await getUnits();
  const occupiedUnits = units.filter(u => u.status === 'مأهولة' && u.currentOccupantId);
  const residents = await getResidents();

  const residentMap = new Map(residents.map(r => [r.id, r.fullName]));
  let count = 0;

  for (const unit of occupiedUnits) {
    if (!unit.currentOccupantId) continue;
    const residentName = residentMap.get(unit.currentOccupantId) || 'ساكن';
    const category = unit.unitCategory || (unit.floor === 0 ? 'حاصل' : 'شقة');

    await createInvoice({
      unitId: unit.id,
      unitNumber: unit.unitNumber,
      unitCategory: category,
      residentId: unit.currentOccupantId,
      residentName,
      period,
      amount: Number(unit.servicesFee) || 0,
      breakdown: { servicesFee: Number(unit.servicesFee) || 0 },
      dueDate,
      status: 'pending',
    });
    count++;
  }

  return count;
};

// تحديث حالة الفاتورة (مدفوعة / معلقة / متأخرة)
export const updateInvoiceStatus = async (
  invoiceId: string,
  status: InvoiceStatus,
  paidDate?: Date
): Promise<void> => {
  const invoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);
  await updateDoc(invoiceRef, {
    status,
    paidDate: paidDate || (status === 'paid' ? new Date() : null),
  });
};

// حذف فاتورة
export const deleteInvoice = async (invoiceId: string): Promise<void> => {
  const invoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);
  await deleteDoc(invoiceRef);
};

// تحديث بيانات الفاتورة
export const updateInvoice = async (invoiceId: string, data: Partial<any>): Promise<void> => {
  const invoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);
  await updateDoc(invoiceRef, data);
};
