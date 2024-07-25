'use client';
import Script from 'next/script';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface TelegramContextProps {
    telegram: any;
    user: any;
}

const TelegramContext = createContext<TelegramContextProps | undefined>(undefined);

export const useTelegram = () => {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used within a TelegramProvider');
  }
  return context;
};

export const TelegramProvider: React.FC<{ src?: string; children: React.ReactNode }> = ({ src = "https://telegram.org/js/telegram-web-app.js", children }) => {
  const [telegram, setTelegram] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  const onLoad = () => {
    const telegram = (typeof window !== 'undefined' ? window as any : global)?.Telegram?.WebApp;
    telegram?.ready();
    telegram?.BiometricManager?.init();
    console.log('telegram',telegram);
    setTelegram(telegram);
    setUser(telegram?.initDataUnsafe?.user || null);
  }

  useEffect(() => {
    return () => telegram && telegram?.MainButton?.offClick();
  }, []);

  return (<>
    <Script {...{src, onLoad}} />
    <TelegramContext.Provider value={{ telegram, user }}>
      {children}
    </TelegramContext.Provider>
  </>
  );
};
