
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
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<CompanyInfo>;
        setCompanyInfo(prev => ({ ...defaultCompanyInfo, ...prev, ...data }));
      } else {
        // If the document doesn't exist, create it with defaults
        setDoc(docRef, defaultCompanyInfo).catch(error => {
            console.error("Failed to create initial company info:", error);
        });
      }
      setIsLoaded(true);
    }, (error) => {
        console.error("Failed to fetch company info from Firestore:", error);
        setIsLoaded(true); // Still allow the app to render with defaults
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);
  

  const handleSetCompanyInfo = async (newInfo: CompanyInfo) => {
    const docRef = doc(db, 'companyInfo', 'main');
    try {
        await setDoc(docRef, newInfo, { merge: true });
        // The onSnapshot listener will update the state automatically
    } catch (error) {
        console.error('Failed to save company info to Firestore', error);
    }
  };

  const value = { 
    companyInfo, 
    setCompanyInfo: handleSetCompanyInfo 
  };

  return (
    <CompanyInfoContext.Provider value={value}>
      {children}
    </CompanyInfoContext.Provider>
  );
};
