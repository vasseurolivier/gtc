
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

// Un logo par défaut au cas où l'utilisateur n'en a pas encore mis
const DEFAULT_LOGO = "https://i.postimg.cc/m2m0XQZp/gtc-logo-placeholder.png";

const defaultCompanyInfo: CompanyInfo = {
  name: 'Global Trading China',
  address: '浙江省, 金华市, 义乌市, 小三里唐3区, 6栋二单元1501',
  email: 'info@globaltradingchina.com',
  phone: '+86 135 6477 0717',
  logo: DEFAULT_LOGO,
  publicLogo: DEFAULT_LOGO,
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
            // Assurer que le logo n'est jamais une chaîne vide pour éviter les erreurs 404
            logo: data.logo || DEFAULT_LOGO,
            publicLogo: data.publicLogo || data.logo || DEFAULT_LOGO
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
