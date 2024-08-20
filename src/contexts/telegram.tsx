'use client';
import Script from 'next/script';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface TelegramContextProps {
  telegram?: Telegram["WebApp"];
  user?: Telegram["WebApp"]['initDataUnsafe']['user'];
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
  const [telegram, setTelegram] = useState<Telegram["WebApp"]>();
  const [user, setUser] = useState<Telegram["WebApp"]['initDataUnsafe']['user']>();

  const onLoad = () => {
    const telegram = (typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : undefined);
    if (telegram) {
      telegram.ready();
      // Assuming BiometricManager exists and has an init method
      if (telegram.BiometricManager) {
        telegram.BiometricManager.init();
      }
      console.log('telegram', telegram);
      setTelegram(telegram);
      setUser(telegram.initDataUnsafe?.user || null);
    }
  };

  useEffect(() => {
    if (telegram) {
      // Define a cleanup function that does not return a value
      return () => {
        if (telegram?.MainButton) telegram?.MainButton?.offClick(() => setUser(undefined));
      };
    }
  }, [telegram]); // Include 'telegram' in dependencies to react to changes

  return (
    <>
      <Script src={src} onLoad={onLoad} />
      <TelegramContext.Provider value={{ telegram, user }}>
        {children}
      </TelegramContext.Provider>
    </>
  );
};
