
'use client';

import React, { createContext, useState, ReactNode, useEffect } from 'react';

export interface CompanyInfo {
  name: string;
  address: string;
  email: string;
  phone: string;
  logo: string; // Base64 data URL for admin
  publicLogo?: string; // Base64 data URL for public site
  heroVideo?: string; // Filename for the hero video
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
    heroVideo: 'hero-video.mp4',
  });
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    try {
        const savedInfo = localStorage.getItem('adminCompanyInfo');
        if (savedInfo) {
            const parsedInfo = JSON.parse(savedInfo);
            // Set default for heroVideo if it's not in saved data
            if (!parsedInfo.heroVideo) {
              parsedInfo.heroVideo = 'hero-video.mp4';
            }
            setCompanyInfo(parsedInfo);
        } else {
             // If no saved info, set the new default
            setCompanyInfo({
                name: 'Yiwu Hunagqing Trading',
                address: '浙江省, 金华市, 义乌市, 小三里唐3区, 6栋二单元1501',
                email: 'info@globaltradingchina.com',
                phone: '+8613564770717',
                logo: '',
                publicLogo: '',
                heroVideo: 'hero-video.mp4',
            });
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
