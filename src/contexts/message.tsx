"use client";

import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { App } from "@coinmeca/wallet-sdk/types";
import { useTelegram } from "hooks";
import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from "react";

export type MessageStrategy = "popup" | "proxy";

export interface MessageRequest {
    method: string | undefined;
    params: any;
    chainId: number | undefined;
    app: App | undefined;
    auth: boolean;
}

export interface MessageProps {
    id: string;
    strategy: MessageStrategy | undefined;
    request: MessageRequest;
}

export interface MessageHandlerProps {
    strategy: MessageStrategy | undefined;
    isPopup: boolean;
    isProxy: boolean;
    messages: MessageProps[];
    getRequest: (method: string) => MessageProps;
    getRequestById: (id?: string) => MessageRequest;
    success: (id: string, result: any) => void;
    failure: (id: string, result: any) => void;
    count: number;
    next: (id: string) => void;
    prev: (id: string) => void;
    remove: (id: string) => void;
}

const target = "coinmeca-wallet";

export const RequestForm = {
    id: undefined,
    strategy: undefined,
    request: { method: undefined, params: undefined, chainId: undefined, app: undefined, auth: undefined },
};

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

    const [portal, setPortal] = useState<Window | undefined>();
    const [messages, setMessages] = useState<MessageProps[]>([]);
    const [strategy, setStrategy] = useState<MessageStrategy>();

    const isPopup = useMemo(() => strategy === "popup", [strategy]);
    const isProxy = useMemo(() => strategy === "proxy", [strategy]);

    useLayoutEffect(() => {
        setPortal(window?.opener || window?.parent);
    }, []);

    useLayoutEffect(() => {
        if (portal) {
            portal.postMessage({ state: "ready" }, "*");

            const messageHandler = (event: MessageEvent) => {
                if (event?.data && (!event.data.result || !event.data.close || !event.data.error) && event?.data?.target === "coinmeca-wallet") {
                    const { id, request } = event.data;

                    if (!messages?.find((m) => m?.id?.toLowerCase() === id?.toLowerCase()) && (!strategy || strategy === event?.data.strategy)) {
                        if (!strategy) setStrategy(event?.data?.strategy);

                        let auth = false;
                        let error: string | undefined;

                        if (request?.params?.from) {
                            if (request?.app?.url) {
                                if (provider?.allowance(request?.app?.url, request?.params?.from)) auth = true;
                                else if (!provider?.isInitialized) auth = true;
                                else error = "The requested account and/or method has not been authorized by the user.";
                            } else error = "Not found app information.";
                        } else if (request?.params?.to) error = "Not found sender information.";

                        if (error) {
                            portal?.postMessage({ target, method: request?.method, error }, "*");
                            if (strategy === "popup") {
                                if (telegram) telegram?.close();
                                window?.close();
                            } else router.push("/");
                        } else setMessages((state) => [...(state || []), { ...event?.data, request: { ...request, auth } }]);
                    }
                }
            };
            window.addEventListener("message", messageHandler);
        }
    }, [portal, provider]);

    useLayoutEffect(() => {
        if (strategy === "popup" && (!path?.startsWith("/lock") || !path?.startsWith("/welcome"))) {
            const handleUnload = () => {
                portal?.postMessage({ target, close: true, error: "User rejected the request" }, "*");
            };
            window.close();
            window.addEventListener("beforeunload", handleUnload);
            return () => window.removeEventListener("beforeunload", handleUnload);
        }
    }, [path]);

    const count = useMemo(() => messages?.length || 0, [messages]);

    const getRequest = useCallback(
        (method: string) => messages?.find((m) => m?.request?.method?.toLowerCase() === method?.toLowerCase()) || ({} as MessageProps),
        [messages],
    );

    const getRequestById = useCallback(
        (id?: string) => (id && messages?.find((m) => m?.id?.toLowerCase() === id?.toLowerCase())?.request) || ({} as MessageRequest),
        [messages],
    );

    const success = useCallback(
        (id: string, result: any) => {
            const message = messages?.find((m) => m?.id === id);
            if (message) {
                portal?.postMessage({ target, id, result, method: message?.request.method, close: count === 1 }, "*");
                if (isProxy) portal?.document?.getElementById(`coinmeca-wallet-proxy-${id}`)?.remove();
            }
        },
        [messages, portal],
    );

    const failure = useCallback(
        (id: string, error: any) => {
            const message = messages?.find((m) => m?.id === id);
            if (message) {
                portal?.postMessage({ target, id, error, method: message?.request.method, close: true }, "*");
                if (isProxy) portal?.document?.getElementById(`coinmeca-wallet-proxy-${id}`)?.remove();
            }
        },
        [messages, portal],
    );

    const close = () => {
        if (telegram) telegram?.close();
        window?.close();
    };

    const next = useCallback(
        (id: string) => {
            if (isPopup) {
                if (count > 1) {
                    const next = messages[(messages?.findIndex((m) => m?.id === id) + 1) % messages.length];
                    if (next?.id !== id) {
                        router.push(`/request/${next?.request?.method}`);
                    } else close();
                } else close();
            }
            if (!strategy) close();
        },
        [messages],
    );

    const prev = useCallback(
        (id: string) => {
            if (isPopup) {
                if (count > 1) {
                    const prev = messages[(messages?.findIndex((m) => m?.id === id) - 1 + messages.length) % messages.length];
                    if (prev?.id !== id) router.push(`/request/${prev?.request?.method}`);
                    else close();
                } else close();
            }
            if (!strategy) close();
        },
        [messages],
    );

    const remove = useCallback((id: string) => setMessages((state) => state?.filter((m) => m?.id !== id)), [messages]);

    return (
        <MessageHandlerContext.Provider
            value={{
                strategy,
                isPopup,
                isProxy,
                messages,
                getRequest,
                getRequestById,
                success,
                failure,
                count,
                next,
                prev,
                remove,
            }}>
            {children}
        </MessageHandlerContext.Provider>
    );
};
