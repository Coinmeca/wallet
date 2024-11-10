"use client";

import { usePathname } from "next/navigation";
import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";

interface MessageProps {
    method: string | undefined;
    params: any;
}

interface MessageHandlerProps extends MessageProps {
    isPopup: boolean;
    popupId?: number;
    message: MessageProps | undefined;
}

const MessageHandlerContext = createContext<MessageHandlerProps | undefined>(undefined);

export const useMessageHandler = () => {
    const context = useContext(MessageHandlerContext);
    if (!context) throw new Error("MessageHandler for useMessage doesn't initialized yet.");
    return context;
};

export const MessageHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const path = usePathname();

    const [popupId, setPopupId] = useState<number>();
    const [isPopup, setIsPopup] = useState(false);
    const [message, setMessage] = useState<any>();

    useLayoutEffect(() => {
        if (typeof window !== "undefined") {
            const check = !!(window as any)?.coinmeca?.isPopup;
            if (check) {
                setIsPopup(check);
                const id = (window as any)?.coinmeca?.popupId;
                if (id) setPopupId(id);
            }

            if ((window as any)?.coinmeca) {
                const request = (window as any)?.coinmeca?.request;
                if (request) setMessage(request);
            }
        }
    }, []);

    useLayoutEffect(() => {
        if (isPopup) window.close();
    }, [path]);

    return <MessageHandlerContext.Provider value={{ ...message, isPopup, popupId, message }}>{children}</MessageHandlerContext.Provider>;
};
