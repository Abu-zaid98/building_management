import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: "AIzaSyD9gKvaNY53FtdwYAaNSHpTbog5VdLUCz0",
  authDomain: "building-home-be9cf.firebaseapp.com",
  projectId: "building-home-be9cf",
  storageBucket: "building-home-be9cf.firebasestorage.app",
  messagingSenderId: "995838800907",
  appId: "1:995838800907:web:64c867bb2535aad6ba030e"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// تثبيت بقاء تسجيل الدخول محلياً على المتصفح حتى بعد إغلاقه
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Firebase setPersistence error:', err);
});

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
