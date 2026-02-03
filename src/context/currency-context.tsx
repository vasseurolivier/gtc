
'use client';

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

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
  const [currency, setCurrencyState] = useState<Currency>({ symbol: '€', code: 'EUR' });
  const [exchangeRate, setExchangeRateState] = useState<number>(0.13);
  const [isLoaded, setIsLoaded] = useState(false);
  const db = useFirestore();

  useEffect(() => {
    if (!db) return;

    const docRef = doc(db, 'config', 'finance');
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.currency) setCurrencyState(data.currency);
        if (data.exchangeRate) setExchangeRateState(data.exchangeRate);
      } else {
        // Initialisation par défaut si le document n'existe pas
        setDoc(docRef, {
            currency: { symbol: '€', code: 'EUR' },
            exchangeRate: 0.13
        }).catch(error => console.error("Error initializing finance config:", error));
      }
      setIsLoaded(true);
    }, (error) => {
        console.error("Error listening to finance config:", error);
        setIsLoaded(true);
    });

    return () => unsubscribe();
  }, [db]);

  const handleSetCurrency = async (newCurrency: Currency) => {
    if (!db) return;
    const docRef = doc(db, 'config', 'finance');
    try {
        await setDoc(docRef, { currency: newCurrency }, { merge: true });
    } catch (error) {
        console.error('Failed to save currency to Firestore', error);
    }
  };
  
  const handleSetExchangeRate = async (newRate: number) => {
    if (!db) return;
    const docRef = doc(db, 'config', 'finance');
    try {
        await setDoc(docRef, { exchangeRate: newRate }, { merge: true });
    } catch (error) {
        console.error('Failed to save exchange rate to Firestore', error);
    }
  };

  return (
    <CurrencyContext.Provider value={{ 
        currency, 
        exchangeRate, 
        setCurrency: handleSetCurrency, 
        setExchangeRate: handleSetExchangeRate 
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};
