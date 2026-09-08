import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getCurrentUserData, logout } from '../services/auth';
import type { AuthUser } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 دقيقة

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const lastActiveStr = localStorage.getItem('building_mgmt_last_active');
      if (lastActiveStr) {
        const elapsed = Date.now() - parseInt(lastActiveStr, 10);
        if (elapsed > SESSION_TIMEOUT_MS) {
          // انتهت مهلة الجلسة لمرور أكثر من 15 دقيقة على إغلاق التاب أو الخمول
          localStorage.removeItem('building_mgmt_user');
          localStorage.removeItem('building_mgmt_last_active');
          sessionStorage.setItem('session_timeout', 'true');
          return null;
        }
      }
      const cached = localStorage.getItem('building_mgmt_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const lastActivityRef = useRef<number>(Date.now());

  const handleLogout = useCallback(async () => {
    try {
      localStorage.removeItem('building_mgmt_user');
      localStorage.removeItem('building_mgmt_last_active');
    } catch {
      // ignore
    }
    await logout();
    setUser(null);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const lastActiveStr = localStorage.getItem('building_mgmt_last_active');
        if (lastActiveStr) {
          const elapsed = Date.now() - parseInt(lastActiveStr, 10);
          if (elapsed > SESSION_TIMEOUT_MS) {
            // مرت 15 دقيقة: إنهاء الجلسة وطلب إعادة تسجيل الدخول
            sessionStorage.setItem('session_timeout', 'true');
            await handleLogout();
            setLoading(false);
            return;
          }
        }

        try {
          const userData = await getCurrentUserData(firebaseUser);
          if (userData) {
            setUser(userData);
            localStorage.setItem('building_mgmt_user', JSON.stringify(userData));
            const now = Date.now();
            lastActivityRef.current = now;
            localStorage.setItem('building_mgmt_last_active', now.toString());
          } else {
            setUser(null);
            localStorage.removeItem('building_mgmt_user');
          }
        } catch (err) {
          console.warn('Error getting user data:', err);
          try {
            const cached = localStorage.getItem('building_mgmt_user');
            if (!cached) setUser(null);
          } catch {
            setUser(null);
          }
        }
      } else {
        setUser(null);
        try {
          localStorage.removeItem('building_mgmt_user');
        } catch {
          // ignore
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [handleLogout]);

  // متابعة نشاط المستخدم وتحديث توقيت آخر استخدام كل 10 ثوانٍ كحد أقصى
  useEffect(() => {
    if (!user) return;

    const now = Date.now();
    lastActivityRef.current = now;
    localStorage.setItem('building_mgmt_last_active', now.toString());

    const handleActivity = () => {
      const currentTime = Date.now();
      if (currentTime - lastActivityRef.current > 10000) {
        lastActivityRef.current = currentTime;
        localStorage.setItem('building_mgmt_last_active', currentTime.toString());
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const lastActiveStr = localStorage.getItem('building_mgmt_last_active');
        if (lastActiveStr) {
          const elapsed = Date.now() - parseInt(lastActiveStr, 10);
          if (elapsed > SESSION_TIMEOUT_MS) {
            sessionStorage.setItem('session_timeout', 'true');
            handleLogout();
            return;
          }
        }
        const currentTime = Date.now();
        lastActivityRef.current = currentTime;
        localStorage.setItem('building_mgmt_last_active', currentTime.toString());
      }
    };

    const handleBeforeUnload = () => {
      localStorage.setItem('building_mgmt_last_active', Date.now().toString());
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // فحص دوري كل 30 ثانية إن كانت الجلسة تخطت 15 دقيقة بدون أي تفاعل
    const timer = setInterval(() => {
      const lastActiveStr = localStorage.getItem('building_mgmt_last_active');
      if (lastActiveStr) {
        const elapsed = Date.now() - parseInt(lastActiveStr, 10);
        if (elapsed > SESSION_TIMEOUT_MS) {
          sessionStorage.setItem('session_timeout', 'true');
          handleLogout();
        }
      }
    }, 30000);

    return () => {
      clearInterval(timer);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, handleLogout]);

  return (
    <AuthContext.Provider value={{ user, loading, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
