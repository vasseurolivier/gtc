
'use client';

import React, { createContext, useState, ReactNode, useEffect } from 'react';

export interface CompanyInfo {
  name: string;
  address: string;
  email: string;
  phone: string;
}

interface CompanyInfoContextType {
  companyInfo: CompanyInfo;
  setCompanyInfo: (info: CompanyInfo) => void;
}

export const CompanyInfoContext = createContext<CompanyInfoContextType | undefined>(undefined);

export const CompanyInfoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '',
    address: '',
    email: '',
    phone: '',
  });
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    try {
        const savedInfo = localStorage.getItem('adminCompanyInfo');
        if (savedInfo) {
            setCompanyInfo(JSON.parse(savedInfo));
        }
    } catch (error) {
        console.error('Failed to load company info from localStorage', error);
    }
    setIsLoaded(true);
  }, []);
  
  useEffect(() => {
    if (isLoaded) {
        try {
            localStorage.setItem('adminCompanyInfo', JSON.stringify(companyInfo));
        } catch (error) {
            console.error('Failed to save company info to localStorage', error);
        }
    }
  }, [companyInfo, isLoaded]);

  const handleSetCompanyInfo = (newInfo: CompanyInfo) => {
    setCompanyInfo(newInfo);
  };

  return (
    <CompanyInfoContext.Provider value={{ companyInfo, setCompanyInfo: handleSetCompanyInfo }}>
      {children}
    </CompanyInfoContext.Provider>
  );
};
