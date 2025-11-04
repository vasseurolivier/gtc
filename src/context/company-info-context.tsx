
'use client';

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface CompanyInfo {
  name: string;
  address: string;
  email: string;
  phone: string;
  logo: string;
  publicLogo?: string;
  brochureUrl?: string;
}

interface CompanyInfoContextType {
  companyInfo: CompanyInfo;
  setCompanyInfo: (info: CompanyInfo) => void;
}

export const CompanyInfoContext = createContext<CompanyInfoContextType | undefined>(undefined);

const defaultCompanyInfo: CompanyInfo = {
  name: 'Yiwu Hunagqing Trading',
  address: '浙江省, 金华市, 义乌市, 小三里唐3区, 6栋二单元1501',
  email: 'info@globaltradingchina.com',
  phone: '+8613564770717',
  logo: '',
  publicLogo: '',
  brochureUrl: '',
};

export const CompanyInfoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(defaultCompanyInfo);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const docRef = doc(db, 'companyInfo', 'main');
    
    // onSnapshot provides real-time updates.
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const firestoreData = docSnap.data() as Partial<CompanyInfo>;
        // Merge Firestore data with defaults to ensure all fields are present
        setCompanyInfo(prevInfo => ({ ...defaultCompanyInfo, ...prevInfo, ...firestoreData }));
      } else {
        // If the document doesn't exist, create it with defaults.
        // This should only happen once.
        setDoc(docRef, defaultCompanyInfo).catch(error => {
            console.error("Failed to create initial company info document:", error);
        });
        setCompanyInfo(defaultCompanyInfo);
      }
      setIsLoaded(true);
    }, (error) => {
        console.error("Failed to listen to company info from Firestore:", error);
        // Fallback to default info if there's an error (e.g., permissions)
        setCompanyInfo(defaultCompanyInfo);
        setIsLoaded(true);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);
  

  const handleSetCompanyInfo = async (newInfo: CompanyInfo) => {
    const docRef = doc(db, 'companyInfo', 'main');
    try {
        // Use set with merge:true to update or create the document without overwriting existing fields unintentionally.
        await setDoc(docRef, newInfo, { merge: true });
        // The onSnapshot listener will update the local state automatically,
        // but we can set it here for immediate UI feedback if needed.
        setCompanyInfo(newInfo);
    } catch (error) {
        console.error('Failed to save company info to Firestore', error);
    }
  };

  const value = { 
    companyInfo, 
    setCompanyInfo: handleSetCompanyInfo 
  };

  // Render children only when data is loaded to prevent initial flicker with default values
  return (
    <CompanyInfoContext.Provider value={value}>
      {isLoaded ? children : null}
    </CompanyInfoContext.Provider>
  );
};
