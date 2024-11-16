"use client";

import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
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
        console.log("message listener");
        console.log(!!window);
        if (typeof window !== "undefined") {
            window?.opener?.postMessage({ state: "ready" }, "*");

            const messageHandler = (event: MessageEvent) => {
                console.log({ data: event });
                if (event?.data) {
                    setPopupId(event?.data?.popupId);
                    setIsPopup(event?.data?.isPopup);

                    const request = event?.data?.request;
                    if (request) {
                        setMessage(request);
                        if (request?.chain) provider?.changeChain(request?.chain);
                        window.removeEventListener("message", messageHandler);
                    }
                }
            };
            window.addEventListener("message", messageHandler);
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
