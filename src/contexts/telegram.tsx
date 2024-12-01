"use client";

import Script from "next/script";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loadTelegram, TelegramController } from "utils";

const TelegramContext = createContext<TelegramController | undefined>(undefined);

export const useTelegram = () => {
    const context = useContext(TelegramContext);
    if (!context) throw new Error("useTelegram must be used within a TelegramProvider");
    return context;
};

export const TelegramProvider: React.FC<{ src?: string; children?: React.ReactNode }> = ({ src = "https://telegram.org/js/telegram-web-app.js", children }) => {
    const [telegram, setTelegram] = useState<Telegram["WebApp"]>();
    const [user, setUser] = useState<Telegram["WebApp"]["initDataUnsafe"]["user"]>();

    const onLoad = () => {
        const telegram: Telegram["WebApp"] = typeof window !== "undefined" ? (window as any).Telegram?.WebApp || (window as any).Telegram?.WebView : undefined;
        if (telegram) {
            telegram.ready();
            // Assuming BiometricManager exists and has an init method
            if (telegram.BiometricManager) telegram.BiometricManager.init();
            telegram?.enableVerticalSwipes();
            setTelegram(telegram);
            setUser(telegram.initDataUnsafe?.user);
        }
    };

    const modules = useMemo(() => loadTelegram(telegram), [telegram]);

    useEffect(() => {
        if (telegram) {
            // Define a cleanup function that does not return a value
            return () => {
                if (telegram?.MainButton) telegram?.MainButton?.offClick(() => setUser(undefined));
            };
        }
    }, [telegram]);

    return (
        <>
            <Script src={src} onLoad={onLoad} />
            <TelegramContext.Provider
                value={{
                    ...{
                        ...modules,
                        exit: (callback?: Function) => {
                            modules.exit(callback);
                            setUser(undefined);
                        },
                    },
                    telegram,
                    user,
                }}>
                {children}
            </TelegramContext.Provider>
        </>
    );
};
