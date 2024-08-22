'use client';
import Script from 'next/script';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface TelegramContextProps {
  telegram?: Telegram["WebApp"]
  user: Telegram["WebApp"]['initDataUnsafe']['user'];
  isInApp?: boolean;
  isVerticalSwipe?: boolean;
  isCloseConfirm?: boolean;
  storage?: CloudStorage;
  send: (text: string) => void | undefined
  enable: {
    vertical: () => void | undefined;
    closeConfirm: () => void | undefined;
}
  disable: {
    vertical: () => void | undefined;
    closeConfirm: () => void | undefined;
}
  bio: {
      request: (reason?: string) => BiometricManager | undefined;
      auth: (reason?: string) => BiometricManager | undefined;
  };
  show: {
      alert: (message: string, callback?: () => void) => void | undefined;
      confirm: (title: string, callback?: (ok: boolean) => void) => void | undefined;
    popup: (popup: PopupParams, callback?: ((button_id: string) => void) | undefined) => void | undefined;
    scanQR: (text: string, callback?: (data: string) => void) => void | undefined;
  };
  open: {
    internal: (url: string, callback?: Function) => void;
    external: (url: string, try_instant_view?: boolean, callback?: Function) => void;
  };
  expand: (callback?: Function) => void;
  exit: (callback?: () => void) => void;

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
      setTelegram(telegram);
      setUser(telegram.initDataUnsafe?.user || null);
    }
  };

  const modules = useMemo(() => ({
    isInApp: telegram && telegram?.platform !== 'unknown',
    isExpanded: telegram?.isExpanded || false,
    isVerticalSwipe: telegram?.isVerticalSwipesEnabled,
    isCloseConfirm: telegram?.isClosingConfirmationEnabled,

    storage: telegram?.CloudStorage,

    send: (text:string) => telegram && telegram?.sendData(text),

    enable: {
      vertical: () => telegram?.enableVerticalSwipes?.(),
      closeConfirm: () => telegram?.enableClosingConfirmation?.(),
    },

    disable: {
      vertical: () => telegram?.disableVerticalSwipes?.(),
      closeConfirm: () => telegram?.disableClosingConfirmation?.(),
    },

    bio: {
      request: (reason?: string) => telegram && telegram.BiometricManager.requestAccess({ reason }),
      auth: (reason?: string) => telegram && telegram.BiometricManager.authenticate({ reason }),
    },

    show: {
      alert: (message: string, callback?: () => void) => telegram && telegram?.showAlert(message, callback),
      confirm: (title: string, callback?: (ok: boolean) => void) => telegram && telegram?.showConfirm(title, callback),
      popup: (popup: PopupParams, callback?: ((button_id: string) => void) | undefined) => telegram && telegram?.showPopup(popup, callback),
      scanQR: (text: string, callback?: (data: string) => void) => telegram && telegram?.showScanQrPopup({text},callback),
    },

    open: {
      internal: (url: string, callback?:Function) => {
        if (telegram) {
          telegram?.openTelegramLink(url);
          callback?.();
        }    
      },
      external: (url: string, try_instant_view?:boolean, callback?:Function) => {
        if (telegram) {
          telegram?.openLink(url, { try_instant_view });
          callback?.();
        }
      },
    },
  
    expand: (callback?: Function) => {
      if (telegram) {
        telegram?.expand();
        callback?.();
      }
    },

    exit: (callback?: () => void) => {
      if (telegram) {
        telegram?.close();
        telegram?.MainButton?.offClick(() => { setUser(undefined);  callback?.()});
      }
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
      <TelegramContext.Provider value={{ telegram, user, ...modules }}>
        {children}
      </TelegramContext.Provider>
    </>
  );
};
