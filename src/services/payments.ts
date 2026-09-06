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
import type { Payment, PaymentFormData } from '../types';
import { updateInvoiceStatus } from './invoices';

const PAYMENTS_COLLECTION = 'payments';

const formatPayment = (id: string, data: any): Payment => ({
  id,
  invoiceId: data.invoiceId || '',
  unitId: data.unitId || '',
  residentId: data.residentId || '',
  amount: data.amount || 0,
  method: data.method || 'نقد',
  paymentDate: data.paymentDate instanceof Timestamp ? data.paymentDate.toDate() : new Date(data.paymentDate || Date.now()),
  receipt: data.receipt || '',
  notes: data.notes || '',
  createdBy: data.createdBy || '',
  createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
});

// جلب جميع المدفوعات
export const getPayments = async (): Promise<Payment[]> => {
  const paymentsRef = collection(db, PAYMENTS_COLLECTION);
  const q = query(paymentsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => formatPayment(docSnap.id, docSnap.data()));
};

// جلب مدفوعات ساكن معين
export const getPaymentsByResident = async (residentId: string): Promise<Payment[]> => {
  const paymentsRef = collection(db, PAYMENTS_COLLECTION);
  const q = query(paymentsRef, where('residentId', '==', residentId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => formatPayment(docSnap.id, docSnap.data()));
};

// تسجيل دفعة جديدة وتحديث الفاتورة إلى مدفوعة تلقائياً
export const recordPayment = async (data: PaymentFormData, createdByUid: string): Promise<string> => {
  const paymentsRef = collection(db, PAYMENTS_COLLECTION);
  const docRef = await addDoc(paymentsRef, {
    ...data,
    createdBy: createdByUid,
    createdAt: serverTimestamp(),
  });

  // تحديث الفاتورة إلى مدفوعة
  if (data.invoiceId) {
    await updateInvoiceStatus(data.invoiceId, 'paid', data.paymentDate);
  }

  return docRef.id;
};

// حذف دفعة
export const deletePayment = async (paymentId: string): Promise<void> => {
  const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
  await deleteDoc(paymentRef);
};

// تعديل بيانات دفعة مسجلة
export const updatePayment = async (paymentId: string, data: Partial<PaymentFormData>): Promise<void> => {
  const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
  await updateDoc(paymentRef, data);
};
