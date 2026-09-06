import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { db } from './firebase';
import type { BuildingInfo } from '../types';

const BUILDING_INFO_DOC = doc(db, 'buildingInfo', 'main');
const STORAGE_KEY = 'building_info_cache';

export const getBuildingInfo = async (): Promise<BuildingInfo | null> => {
  try {
    const snap = await getDoc(BUILDING_INFO_DOC);
    if (!snap.exists()) return null;
    const data = snap.data() as BuildingInfo;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
    return data;
  } catch (err) {
    console.error('Failed to get building info:', err);
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
    return null;
  }
};

export const updateBuildingInfo = async (data: BuildingInfo): Promise<void> => {
  await setDoc(BUILDING_INFO_DOC, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
};

export const useBuildingInfo = () => {
  const [buildingInfo, setBuildingInfo] = useState<BuildingInfo | null>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(!buildingInfo);

  useEffect(() => {
    const unsubscribe = onSnapshot(BUILDING_INFO_DOC, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as BuildingInfo;
        setBuildingInfo(data);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch {
          // ignore
        }
      }
      setLoading(false);
    }, (error) => {
      console.warn('Error listening to building info:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { buildingInfo, loading };
};

