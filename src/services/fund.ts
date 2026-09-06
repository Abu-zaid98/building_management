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
import type { FundTransaction, FundTransactionFormData } from '../types';

const FUND_COLLECTION = 'fund_transactions';

const formatTransaction = (id: string, data: any): FundTransaction => ({
  id,
  type: data.type || 'expense',
  category: data.category || 'أخرى',
  title: data.title || '',
  amount: Number(data.amount) || 0,
  date: data.date || new Date().toISOString().split('T')[0],
  invoiceNumber: data.invoiceNumber || '',
  invoiceReceiptUrl: data.invoiceReceiptUrl || '',
  paidToOrReceivedFrom: data.paidToOrReceivedFrom || '',
  paymentMethod: data.paymentMethod || 'نقد',
  notes: data.notes || '',
  createdBy: data.createdBy || '',
  createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
  updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
});

// جلب جميع حركات الصندوق - بدون بيانات وهمية
export const getFundTransactions = async (): Promise<FundTransaction[]> => {
  try {
    const fRef = collection(db, FUND_COLLECTION);
    const q = query(fRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(docSnap => formatTransaction(docSnap.id, docSnap.data()));
  } catch (error) {
    console.error('Error getting fund transactions:', error);
    return [];
  }
};

// إضافة حركة جديدة للصندوق (إيراد أو مصروف)
export const addFundTransaction = async (data: FundTransactionFormData): Promise<string> => {
  const fRef = collection(db, FUND_COLLECTION);
  const docRef = await addDoc(fRef, {
    ...data,
    amount: Number(data.amount) || 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

// تعديل حركة في الصندوق
export const updateFundTransaction = async (
  id: string,
  data: Partial<FundTransactionFormData>
): Promise<void> => {
  const docRef = doc(db, FUND_COLLECTION, id);
  const payload: any = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  if (data.amount !== undefined) {
    payload.amount = Number(data.amount);
  }
  await updateDoc(docRef, payload);
};

// حذف حركة من الصندوق
export const deleteFundTransaction = async (id: string): Promise<void> => {
  const docRef = doc(db, FUND_COLLECTION, id);
  await deleteDoc(docRef);
};

// مسح وتفريغ كافة حركات الصندوق (لحذف أي بيانات تجريبية سابقة)
export const clearAllFundTransactions = async (): Promise<void> => {
  const fRef = collection(db, FUND_COLLECTION);
  const snapshot = await getDocs(fRef);
  const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, FUND_COLLECTION, d.id)));
  await Promise.all(deletePromises);
};
