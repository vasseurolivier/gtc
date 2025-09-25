
'use client';

import React, { createContext, useState, ReactNode, useEffect } from 'react';

export interface CompanyInfo {
  name: string;
  address: string;
  email: string;
  phone: string;
  logo: string; // Base64 data URL
}

interface CompanyInfoContextType {
  companyInfo: CompanyInfo;
  setCompanyInfo: (info: CompanyInfo) => void;
}

export const CompanyInfoContext = createContext<CompanyInfoContextType | undefined>(undefined);

export const CompanyInfoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: 'Global Trading China',
    address: '浙江省, 金华市, 义乌市, 小三里唐3区, 6栋二单元1501',
    email: 'info@globaltradingchina.com',
    phone: '+8613564770717',
    logo: '',
  });
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    try {
        const savedInfo = localStorage.getItem('adminCompanyInfo');
        if (savedInfo) {
            const parsedInfo = JSON.parse(savedInfo);
            // Quick check to see if it's the old info
            if (parsedInfo.name !== 'Global Trading China') {
                // If it's old info, we can either merge or replace.
                // For this change, we'll replace to ensure consistency with user request.
                setCompanyInfo({
                    name: 'Global Trading China',
                    address: '浙江省, 金华市, 义乌市, 小三里唐3区, 6栋二单元1501',
                    email: 'info@globaltradingchina.com',
                    phone: '+8613564770717',
                    logo: parsedInfo.logo || '', // keep old logo if it exists
                });
            } else {
                setCompanyInfo(parsedInfo);
            }
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

    