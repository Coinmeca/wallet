"use client";

import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider";
import { Account, App } from "@coinmeca/wallet-sdk/types";
import { useTelegram } from "hooks";
import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";

interface MessageProps {
    method: string | undefined;
    params: any;
    app: App | undefined;
}

interface MessageHandlerProps extends MessageProps {
    isPopup: boolean;
    popupId?: number;
    message: MessageProps | undefined;
    app: App;
    auth: boolean;
}

const MessageHandlerContext = createContext<MessageHandlerProps | undefined>(undefined);

export const useMessageHandler = () => {
    const context = useContext(MessageHandlerContext);
    if (!context) throw new Error("MessageHandler for useMessage doesn't initialized yet.");
    return context;
};

export const MessageHandler: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const path = usePathname();
    const router = useRouter();

    const { telegram } = useTelegram();
    const { provider } = useCoinmecaWalletProvider();

    const [popupId, setPopupId] = useState<number>();
    const [isPopup, setIsPopup] = useState(false);
    const [message, setMessage] = useState<any>();
    const [auth, setAuth] = useState<boolean | undefined>(undefined);

    useLayoutEffect(() => {
        if (typeof window !== "undefined") {
            const check = !!(window as any)?.coinmeca?.isPopup;
            if (check) {
                setIsPopup(check);
                const id = (window as any)?.coinmeca?.popupId;
                if (id) setPopupId(id);
            }

            const request = (window as any)?.coinmeca?.request;
            if (request) setMessage(request);
        }
    }, []);

    useLayoutEffect(() => {
        if (provider)
            setAuth(() => {
                if (message?.params?.from) {
                    if (provider?.allowance(message?.app?.url, message?.params?.from)) return true;
                    else {
                        window?.opener?.postMessage(
                            {
                                method: message?.method,
                                error: "The requested account and/or method has not been authorized by the user.",
                            },
                            "*",
                        );
                        if (isPopup) {
                            if (telegram) telegram?.close();
                            window?.close();
                        } else router.push("/");
                        return false;
                    }
                } else return false;
            });
    }, [provider]);

    useLayoutEffect(() => {
        if (!path?.startsWith("/lock")) {
            const handleUnload = () => {
                window?.opener?.postMessage(
                    {
                        close: true,
                        error: "User rejected the request",
                    },
                    "*",
                );
            };
            if (isPopup) window.close();
            window.addEventListener("beforeunload", handleUnload);
            return () => window.removeEventListener("beforeunload", handleUnload);
        }
    }, [path]);

    return (
        <MessageHandlerContext.Provider value={{ ...message, isPopup, popupId, message, app: message?.app, auth }}>{children}</MessageHandlerContext.Provider>
    );
};
