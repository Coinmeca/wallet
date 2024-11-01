import { useStorage } from "hooks";
import { useSearchParams } from "next/navigation";
import React, { createContext, useContext, useLayoutEffect, useMemo, useState } from "react";

interface PopupContextProps {
    isPopup: boolean;
    popupId?: number;
}

const PopupContext = createContext<PopupContextProps | undefined>(undefined);

export const usePopupChecker = () => {
    const context = useContext(PopupContext);
    if (!context) throw new Error("PopupContext for usePopup doesn't initialized yet.");
    return context;
};

export const PopupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [popupId, setPopupId] = useState<number>();
    const [isPopup, setIsPopup] = useState(false);

    useLayoutEffect(() => {
        if (typeof window !== "undefined") {
            const check = !!(window as any)?.coinmeca?.isPopup;
            if (check) {
                setIsPopup(check);
                const id = (window as any)?.coinmeca?.popupId;
                if (id) setPopupId(id);
            }
        }
    }, []);

    console.log({ isPopup });

    return <PopupContext.Provider value={{ isPopup, popupId }}>{children}</PopupContext.Provider>;
};
