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

type MessageStrategy = "popup" | "proxy";

interface MessageHandlerProps extends MessageProps {
    isPopup: boolean;
    isProxy: boolean;
    messageId: number | undefined;
    message: MessageProps | undefined;
    strategy: MessageStrategy | undefined;
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

    const [messageId, setMessageId] = useState<number>();
    const [strategy, setStrategy] = useState<MessageStrategy>();
    const [isPopup, setIsPopup] = useState(false);
    const [isProxy, setIsProxy] = useState(false);
    const [message, setMessage] = useState<MessageProps>();
    const [auth, setAuth] = useState<boolean | undefined>(undefined);

    useLayoutEffect(() => {
        if (typeof window !== "undefined") {
            const portal = window?.opener || window?.parent;
            portal?.postMessage({ state: "ready" }, "*");
            
            const messageHandler = (event: MessageEvent) => {
                if (event?.data) {
                    if (!messageId || event?.data?.id !== event?.data?.id) {    
                        setMessageId(event?.data?.id);
                        setStrategy(event?.data?.strategy);

                        if (!!event?.data?.strategy) {
                            switch (event?.data?.strategy) {
                                case "popup":
                                    setIsPopup(true);
                                    break;
                                case "proxy":
                                    setIsProxy(true);
                                    break;
                                default:
                                    break;
                            }
                        }

                        const request = event?.data?.request;
                        if (request) {
                            setMessage(request);
                            if (request?.chainId) provider?.changeChain(request.chainId);
                            window.removeEventListener("message", messageHandler);
                        }
                    }
                }
            };
            window.addEventListener("message", messageHandler);
        }
    }, []);

    useLayoutEffect(() => {
        if (strategy === "popup" && (!path?.startsWith("/lock") || !path?.startsWith("/welcome"))) {
            const portal = window?.opener || window?.parent;
            const handleUnload = () => {
                portal?.postMessage(
                    {
                        close: true,
                        error: "User rejected the request",
                    },
                    "*",
                );
            };
            window.close();
            window.addEventListener("beforeunload", handleUnload);
            return () => window.removeEventListener("beforeunload", handleUnload);
        }
    }, [path]);

    useEffect(() => {
        if (provider) {
            let result = false;
            let error: string | undefined;

            if (message?.params?.from) {
                if (message?.app?.url) {
                    if (provider?.allowance(message?.app?.url, message?.params?.from)) result = true;
                    else if (!provider?.isInitialized) result = true;
                    else error = "The requested account and/or method has not been authorized by the user.";
                } else error = "Not found app information."
            } else if (message?.params?.to) error = "Not found sender information."

            if (error) {
                const portal = window?.opener || window?.parent;
                portal?.postMessage(
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

            setAuth(result);
        }
    }, [provider, message]);

    return (
        <MessageHandlerContext.Provider
            value={{ isPopup, isProxy, strategy, messageId, message, method: message?.method, params: message?.params, chainId: message?.chainId, app: message?.app, auth }}>
            {children}
        </MessageHandlerContext.Provider>
    );
};
