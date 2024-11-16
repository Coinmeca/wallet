"use client";

import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { App } from "@coinmeca/wallet-sdk/types";
import { useTelegram } from "hooks";
import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";

interface MessageProps {
    method: string | undefined;
    params: any;
    app: App | undefined;
    chainId: number | undefined;
}

interface MessageHandlerProps extends MessageProps {
    isPopup: boolean;
    popupId?: number;
    message: MessageProps | undefined;
    auth: boolean | undefined;
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
    const [message, setMessage] = useState<MessageProps>();
    const [auth, setAuth] = useState<boolean | undefined>(undefined);

    useLayoutEffect(() => {
        if (typeof window !== "undefined") {
            window?.opener?.postMessage({ state: "ready" }, "*");

            const messageHandler = (event: MessageEvent) => {
                if (event?.data) {
                    setPopupId(event?.data?.popupId);
                    setIsPopup(event?.data?.isPopup);

                    const request = event?.data?.request;
                    if (request) {
                        setMessage(request);
                        if (request?.chainId) provider?.changeChain(request.chainId);
                        window.removeEventListener("message", messageHandler);
                    }
                }
            };
            window.addEventListener("message", messageHandler);
        }
    }, []);

    useLayoutEffect(() => {
        if (!path?.startsWith("/lock") || !path?.startsWith("/welcome")) {
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

    useEffect(() => {
        if (provider)
            setAuth(() => {
                let result = false;
                let error: string | undefined;
                if (message?.params?.from) {
                    if (message?.app?.url) {
                        if (provider?.allowance(message?.app?.url, message?.params?.from)) result = true;
                        else if (!provider?.isInitialized) result = true;
                        else error = "The requested account and/or method has not been authorized by the user.";
                    } else error = "Not found app information.";
                } else error = "Not found sender information.";

                if (!result) {
                    window?.opener?.postMessage(
                        {
                            method: message?.method,
                            error,
                        },
                        "*",
                    );
                    if (isPopup) {
                        if (telegram) telegram?.close();
                        window?.close();
                    } else router.push("/");
                }
                return result;
            });
    }, [provider]);

    return (
        <MessageHandlerContext.Provider
            value={{ isPopup, popupId, message, method: message?.method, params: message?.params, chainId: message?.chainId, app: message?.app, auth }}>
            {children}
        </MessageHandlerContext.Provider>
    );
};
