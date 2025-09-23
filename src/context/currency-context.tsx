
'use client';

import React, { createContext, useState, ReactNode, useEffect } from 'react';

interface Currency {
  symbol: string;
  code: string;
}

interface CurrencyContextType {
  currency: Currency;
  exchangeRate: number;
  setCurrency: (currency: Currency) => void;
  setExchangeRate: (rate: number) => void;
}

export const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>({ symbol: '€', code: 'EUR' });
  const [exchangeRate, setExchangeRate] = useState<number>(0.13); // Default rate for CNY to EUR
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedCurrency = localStorage.getItem('adminCurrency');
      const savedRate = localStorage.getItem('adminExchangeRate');
      if (savedCurrency) {
        setCurrency(JSON.parse(savedCurrency));
      }
      if (savedRate) {
        setExchangeRate(Number(JSON.parse(savedRate)));
      }
    } catch (error) {
      console.error('Failed to load currency settings from localStorage', error);
    }
    setIsLoaded(true);
  }, []);
  
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('adminCurrency', JSON.stringify(currency));
        localStorage.setItem('adminExchangeRate', JSON.stringify(exchangeRate));
      } catch (error) {
        console.error('Failed to save currency settings to localStorage', error);
      }
    }
  }, [currency, exchangeRate, isLoaded]);

  const handleSetCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
  };
  
  const handleSetExchangeRate = (newRate: number) => {
    setExchangeRate(newRate);
  };

  return (
    <CurrencyContext.Provider value={{ currency, exchangeRate, setCurrency: handleSetCurrency, setExchangeRate: handleSetExchangeRate }}>
      {children}
    </CurrencyContext.Provider>
  );
};
