'use client';

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client'; // Use client-side db

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
        setCompanyInfo(prevInfo => ({ ...defaultCompanyInfo, ...prevInfo, ...firestoreData }));
      } else {
        setDoc(docRef, defaultCompanyInfo).catch(error => {
            console.error("Failed to create initial company info document:", error);
        });
        setCompanyInfo(defaultCompanyInfo);
      }
      setIsLoaded(true);
    }, (error) => {
        console.error("Failed to listen to company info from Firestore:", error);
        setCompanyInfo(defaultCompanyInfo);
        setIsLoaded(true);
    });

    return () => unsubscribe();
  }, []);

  const handleSetCompanyInfo = async (newInfo: CompanyInfo) => {
    const docRef = doc(db, 'companyInfo', 'main');
    try {
        await setDoc(docRef, newInfo, { merge: true });
        // The onSnapshot listener will update the local state automatically,
        // but we can set it here for immediate UI feedback if needed.
        // setCompanyInfo(newInfo); // This line is not strictly necessary due to onSnapshot
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
      {isLoaded ? children : null}
    </CompanyInfoContext.Provider>
  );
};
