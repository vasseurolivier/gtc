
'use client';

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

export interface CompanyInfo {
  name: string;
  address: string;
  email: string;
  phone: string;
  logoAdmin: string;
  logoDocument: string;
  logoCommercial: string;
  brochureUrl?: string;
}

interface CompanyInfoContextType {
  companyInfo: CompanyInfo;
  setCompanyInfo: (info: CompanyInfo) => void;
  isCompanyInfoLoaded: boolean;
}

export const CompanyInfoContext = createContext<CompanyInfoContextType | undefined>(undefined);

const DEFAULT_LOGO = "https://placehold.co/600x200/e11d48/white?text=Global+Trading+China";

const defaultCompanyInfo: CompanyInfo = {
  name: 'Global Trading China',
  address: '浙江省, 金华市, 义乌市, 小三里唐3区, 6栋二单元1501',
  email: 'info@globaltradingchina.com',
  phone: '+86 135 6477 0717',
  logoAdmin: DEFAULT_LOGO,
  logoDocument: DEFAULT_LOGO,
  logoCommercial: DEFAULT_LOGO,
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
        const data = docSnap.data();
        setCompanyInfoState({
            ...defaultCompanyInfo,
            ...data,
            // Fallbacks for migration
            logoAdmin: data.logoAdmin || data.logo || DEFAULT_LOGO,
            logoDocument: data.logoDocument || data.publicLogo || data.logo || DEFAULT_LOGO,
            logoCommercial: data.logoCommercial || data.publicLogo || data.logo || DEFAULT_LOGO
        } as CompanyInfo);
      } else {
        setDoc(docRef, defaultCompanyInfo).catch(console.error);
        setCompanyInfoState(defaultCompanyInfo);
      }
      setIsCompanyInfoLoaded(true);
    }, (error) => {
        console.error("Error loading company info:", error);
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
        console.error('Failed to save company info:', error);
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
