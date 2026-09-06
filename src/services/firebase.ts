import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
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
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
