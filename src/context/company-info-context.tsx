
'use client';

import React, { createContext, useState, ReactNode, useEffect } from 'react';

export interface CompanyInfo {
  name: string;
  address: string;
  email: string;
  phone: string;
  logo: string; // Base64 data URL for admin
  publicLogo?: string; // Base64 data URL for public site
  heroVideo?: string; // Base64 data URL for the hero video
}

interface CompanyInfoContextType {
  companyInfo: CompanyInfo;
  setCompanyInfo: (info: CompanyInfo) => void;
}

export const CompanyInfoContext = createContext<CompanyInfoContextType | undefined>(undefined);

export const CompanyInfoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: 'Yiwu Hunagqing Trading',
    address: '浙江省, 金华市, 义乌市, 小三里唐3区, 6栋二单元1501',
    email: 'info@globaltradingchina.com',
    phone: '+8613564770717',
    logo: '',
    publicLogo: '',
    heroVideo: '',
  });
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    try {
        const savedInfo = localStorage.getItem('adminCompanyInfo');
        if (savedInfo) {
            const parsedInfo = JSON.parse(savedInfo);
            setCompanyInfo(parsedInfo);
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
            // This can happen if the video is too large for localStorage
            if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
                 alert("Could not save settings. The video file might be too large. Please use a smaller video.");
            } else {
                console.error('Failed to save company info to localStorage', error);
            }
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
