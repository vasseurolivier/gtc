
'use client';

import React, { createContext, useState, ReactNode } from 'react';

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
  const [exchangeRate, setExchangeRate] = useState<number>(1);

  return (
    <CurrencyContext.Provider value={{ currency, exchangeRate, setCurrency, setExchangeRate }}>
      {children}
    </CurrencyContext.Provider>
  );
};
