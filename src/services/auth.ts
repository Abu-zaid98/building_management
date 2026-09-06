import { initializeApp, deleteApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  getAuth,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, firebaseConfig } from './firebase';
import type { AuthUser, UserRole } from '../types';

// ===== تحديد دور المستخدم =====
export const getUserRole = async (uid: string): Promise<UserRole | null> => {
  // تحقق من الأدمن
  const adminDoc = await getDoc(doc(db, 'admins', uid));
  if (adminDoc.exists()) return 'admin';

  // تحقق من الساكن
  const residentsRef = collection(db, 'residents');
  const q = query(residentsRef, where('uid', '==', uid));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) return 'resident';

  return null;
};

// ===== تسجيل دخول الأدمن (Email + Password) =====
export const loginAdmin = async (email: string, password: string): Promise<AuthUser> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const role = await getUserRole(userCredential.user.uid);

  if (role !== 'admin') {
    await signOut(auth);
    throw new Error('هذا الحساب ليس حساب أدمن');
  }

  const adminDoc = await getDoc(doc(db, 'admins', userCredential.user.uid));
  const adminData = adminDoc.data();

  return {
    uid: userCredential.user.uid,
    email: userCredential.user.email!,
    role: 'admin',
    displayName: adminData?.name || 'مجلس الإدارة',
  };
};

// ===== تسجيل دخول الساكن (رقم الهوية + كلمة المرور) =====
export const loginResident = async (idNumber: string, password: string): Promise<AuthUser> => {
  // البريد الإلكتروني المصطنع للساكن
  const email = `${idNumber}@building-home.com`;

  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const role = await getUserRole(userCredential.user.uid);

  if (role !== 'resident') {
    await signOut(auth);
    throw new Error('لم يتم العثور على بيانات الساكن');
  }

  // جلب اسم الساكن
  const residentsRef = collection(db, 'residents');
  const q = query(residentsRef, where('uid', '==', userCredential.user.uid));
  const snapshot = await getDocs(q);
  const residentData = snapshot.docs[0]?.data();

  return {
    uid: userCredential.user.uid,
    email: userCredential.user.email!,
    role: 'resident',
    displayName: residentData?.fullName || idNumber,
  };
};

// ===== إنشاء حساب ساكن جديد (معزول لعدم التأثير على جلسة الأدمن) =====
export const createResidentAccount = async (
  idNumber: string,
  residentId: string,
  _fullName: string
): Promise<string> => {
  const email = `${idNumber}@building-home.com`;
  const password = `${idNumber}@123`;

  // نستخدم تطبيق ثانوي معزول حتى لا يتم تبديل مستخدم الجلسة الحالية للأدمن
  const secondaryAppName = `SecondaryApp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = userCredential.user.uid;

    // تسجيل الخروج فوراً وحذف التطبيق الثانوي لتحرير الموارد
    await signOut(secondaryAuth);
    await deleteApp(secondaryApp);

    // حفظ uid في وثيقة الساكن داخل Firestore
    await setDoc(doc(db, 'residents', residentId), { uid }, { merge: true });

    return uid;
  } catch (error) {
    try {
      await deleteApp(secondaryApp);
    } catch {
      // ignore
    }
    throw error;
  }
};

// ===== إعادة تعيين كلمة مرور الساكن إلى الافتراضية (idNumber@123) =====
export const resetResidentPassword = async (idNumber: string): Promise<void> => {
  const email = `${idNumber}@building-home.com`;
  const defaultPassword = `${idNumber}@123`;

  const secondaryAppName = `ResetApp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    // تسجيل الدخول بالحساب الحالي للساكن (بدون معرفة كلمة المرور القديمة)
    // نستخدم sendPasswordResetEmail بدلاً أو نعتمد على signInWithEmailAndPassword مع كلمة المرور الحالية غير المعروفة
    // الحل: نحذف الحساب ونعيد إنشاءه بنفس الـ email وكلمة المرور الافتراضية
    // لكن هذا قد يغير الـ uid، لذلك نعيد إنشاء الحساب بطريقة أخرى:
    // نستخدم Firebase Admin عبر دالة سحابية، أو نعيد إنشاء الحساب
    // الحل المتاح من الـ client side: إعادة إنشاء الحساب
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, defaultPassword)
      .catch(async (err) => {
        if (err.code === 'auth/email-already-in-use') {
          // الحساب موجود، نحاول تسجيل الدخول بكلمة المرور الافتراضية أولاً
          // إذا نجح فالمرور الافتراضية لم تتغير
          throw new Error('RESET_VIA_CLOUD');
        }
        throw err;
      });
    await signOut(secondaryAuth);
    await deleteApp(secondaryApp);
    // حفظ uid الجديد
    const uid = userCredential.user.uid;
    const { doc, setDoc } = await import('firebase/firestore');
    await setDoc(doc(db, 'residents', idNumber), { uid }, { merge: true });
  } catch (error: any) {
    try { await deleteApp(secondaryApp); } catch { /* ignore */ }
    throw error;
  }
};

// ===== إعادة تعيين كلمة مرور الساكن عبر تطبيق ثانوي (الطريقة الصحيحة) =====
export const resetResidentPasswordViaSecondaryApp = async (
  idNumber: string,
  currentPasswordAttempt?: string
): Promise<void> => {
  const email = `${idNumber}@building-home.com`;
  const defaultPassword = `${idNumber}@123`;

  const secondaryAppName = `ResetApp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    // محاولة تسجيل الدخول بكلمة المرور الافتراضية
    const passwordsToTry = currentPasswordAttempt
      ? [currentPasswordAttempt, defaultPassword]
      : [defaultPassword];

    let loggedIn = false;
    for (const pwd of passwordsToTry) {
      try {
        await signInWithEmailAndPassword(secondaryAuth, email, pwd);
        loggedIn = true;
        break;
      } catch {
        // جرب التالي
      }
    }

    if (!loggedIn) {
      throw new Error('auth/wrong-password');
    }

    const user = secondaryAuth.currentUser;
    if (!user) throw new Error('لم يتم العثور على المستخدم');

    await updatePassword(user, defaultPassword);
    await signOut(secondaryAuth);
    await deleteApp(secondaryApp);
  } catch (error) {
    try { await deleteApp(secondaryApp); } catch { /* ignore */ }
    throw error;
  }
};

// ===== إنشاء حساب أدمن (معزول أيضاً) =====
export const createAdminAccount = async (
  email: string,
  password: string,
  name: string
): Promise<void> => {
  const secondaryAppName = `AdminSecondary_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = userCredential.user.uid;

    await signOut(secondaryAuth);
    await deleteApp(secondaryApp);

    await setDoc(doc(db, 'admins', uid), {
      email,
      name,
      createdAt: new Date(),
    });
  } catch (error) {
    try {
      await deleteApp(secondaryApp);
    } catch {
      // ignore
    }
    throw error;
  }
};

// ===== تسجيل الخروج =====
export const logout = async (): Promise<void> => {
  await signOut(auth);
};

// ===== تغيير كلمة المرور =====
export const changePassword = async (
  user: User,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const credential = EmailAuthProvider.credential(user.email!, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
};

// ===== جلب بيانات المستخدم الحالي =====
export const getCurrentUserData = async (user: User): Promise<AuthUser | null> => {
  const role = await getUserRole(user.uid);
  if (!role) return null;

  if (role === 'admin') {
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    return {
      uid: user.uid,
      email: user.email!,
      role: 'admin',
      displayName: adminDoc.data()?.name,
    };
  }

  // ساكن
  const residentsRef = collection(db, 'residents');
  const q = query(residentsRef, where('uid', '==', user.uid));
  const snapshot = await getDocs(q);
  const residentData = snapshot.docs[0]?.data();

  return {
    uid: user.uid,
    email: user.email!,
    role: 'resident',
    displayName: residentData?.fullName,
  };
};
