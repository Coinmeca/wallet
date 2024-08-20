'use client';
import Script from 'next/script';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface TelegramContextProps {
  telegram?: Telegram["WebApp"];
  user?: Telegram["WebApp"]['initDataUnsafe']['user'];
  bio: {
      request: (reason?: string) => BiometricManager | undefined;
      auth: (reason?: string) => BiometricManager | undefined;
  };
  show: {
      confirm: (title: string, callback?: Function) => void;
      popup: (popup: PopupParams, callback?: Function) => void;
  };
  expand: (callback?: Function) => void;
  exit: (callback?: Function) => void;
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

  const actions = useMemo(() => ({
    bio: {
      request: (reason?: string) => {
        if(telegram) return telegram.BiometricManager.requestAccess({ reason });
      },
      
      auth: (reason?: string) => {
        if(telegram) return telegram.BiometricManager.authenticate({ reason });
      },
    },

    show: {
      confirm: (title: string, callback?: Function) => {
        if (telegram) telegram?.showConfirm(title);
        callback?.();
      },
      popup: (popup: PopupParams, callback?: Function) => {
        if (telegram) telegram?.showPopup(popup)
        callback?.();
      }
    },
  
    expand: (callback?: Function) => {
      if (telegram) telegram?.expand();
      callback?.();
    },

    exit: (callback?:Function) => {
      telegram?.close();
      if (telegram?.MainButton) telegram?.MainButton?.offClick(() => setUser(undefined));
      callback?.();
    },
  }), [telegram])



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
      <TelegramContext.Provider value={{ telegram, user, ...actions }}>
        {children}
      </TelegramContext.Provider>
    </>
  );
};
