
'use client';

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

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
  isCompanyInfoLoaded: boolean;
}

export const CompanyInfoContext = createContext<CompanyInfoContextType | undefined>(undefined);

const defaultCompanyInfo: CompanyInfo = {
  name: 'Yiwu Huanqiu Trading',
  address: '浙江省, 金华市, 义乌市, 小三里唐3区, 6栋二单元1501',
  email: 'info@globaltradingchina.com',
  phone: '+8613564770717',
  logo: '',
  publicLogo: '',
  brochureUrl: '',
};

export const CompanyInfoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [companyInfo, setCompanyInfoState] = useState<CompanyInfo>(defaultCompanyInfo);
  const [isCompanyInfoLoaded, setIsCompanyInfoLoaded] = useState(false);
  const db = useFirestore();

  useEffect(() => {
    if (!db) return;

    const docRef = doc(db, 'companyInfo', 'main');
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setCompanyInfoState(prev => ({ ...prev, ...docSnap.data() as Partial<CompanyInfo> }));
      } else {
        // If the document does not exist, create it with default values.
        setDoc(docRef, defaultCompanyInfo).catch(error => {
            console.error("Failed to create initial company info document:", error);
        });
        setCompanyInfoState(defaultCompanyInfo);
      }
      setIsCompanyInfoLoaded(true);
    }, (error) => {
        console.error("Failed to listen to company info from Firestore:", error);
        setCompanyInfoState(defaultCompanyInfo);
        setIsCompanyInfoLoaded(true);
    });

    return () => unsubscribe();
  }, [db]);

  const handleSetCompanyInfo = async (newInfo: CompanyInfo) => {
    if (!db) return;
    const docRef = doc(db, 'companyInfo', 'main');
    try {
        await setDoc(docRef, newInfo, { merge: true });
    } catch (error) {
        console.error('Failed to save company info to Firestore', error);
    }
  };
  
  const value = { 
    companyInfo: companyInfo, 
    setCompanyInfo: handleSetCompanyInfo,
    isCompanyInfoLoaded
  };

  return (
    <CompanyInfoContext.Provider value={value}>
      {children}
    </CompanyInfoContext.Provider>
  );
};
