import { useStorage } from "hooks";
import React, { createContext, useContext, useLayoutEffect, useMemo, useState } from "react";

interface PopupContextProps {
    isPopup: boolean;
}

const PopupContext = createContext<PopupContextProps | undefined>(undefined);

export const usePopupChecker = () => {
    const context = useContext(PopupContext);
    if (!context) throw new Error("PopupContext for usePopup doesn't initialized yet.");
    return context;
};

export const PopupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { session } = useStorage();
    const [isPopup, setIsPopup] = useState(false);

    useLayoutEffect(() => {
        const handleMessage = (event: any) => {
            if (event.origin === window.location.origin && event.data.isPopup) {
                setIsPopup(event.data.isPopup)
                session?.set('popup', true);
            } else {
                const popup = session?.get('popup');
                if (popup) setIsPopup(true);
            };
        };

        window.addEventListener("message", handleMessage);
        return () => {
            window.removeEventListener("message", handleMessage);
            session?.remove('popup');
        }
    }, []);

    console.log({isPopup})

    return <PopupContext.Provider value={{ isPopup }}>{children}</PopupContext.Provider>;
};
