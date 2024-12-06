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
    time: number;
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
    next: (id: string) => string | undefined;
    prev: (id: string) => string | undefined;
    close: () => void;
    remove: (id: string) => void;
    current: string;
    setCurrent: React.Dispatch<React.SetStateAction<string>>;
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

const channel = new BroadcastChannel("coinmeca:wallet");

export const MessageHandler: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const path = usePathname();
    const router = useRouter();

    const { telegram } = useTelegram();
    const { provider } = useCoinmecaWalletProvider();

    const [portal, setPortal] = useState<Window | undefined>();
    const [messages, setMessages] = useState<MessageProps[]>([]);
    const [strategy, setStrategy] = useState<MessageStrategy>();
    const [current, setCurrent] = useState<string>("");

    const isPopup = useMemo(() => strategy === "popup", [strategy]);
    const isProxy = useMemo(() => strategy === "proxy", [strategy]);

    useLayoutEffect(() => {
        setPortal(window?.opener || window?.parent);
    }, []);

    console.log({ messages });

    useLayoutEffect(() => {
        if (portal) {
            channel.postMessage({ target: "coinmeca-wallet", state: "ready" });

            channel.onmessage = (event) => {
                if (
                    event?.data &&
                    event?.data?.id &&
                    event?.data?.request &&
                    (!event.data.result || !event.data.close || !event.data.error) &&
                    event?.data?.target === "coinmeca-wallet"
                ) {
                    const { id, request } = event.data;

                    if (!messages?.find((m) => m?.id?.toLowerCase().trim() === id?.toLowerCase().trim())) {
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
                            channel.postMessage({ target, method: request?.method, error });
                            if (strategy === "popup") {
                                if (telegram) telegram?.close();
                                window?.close();
                            } else router.push("/");
                        } else setMessages((state) => [...(state || []), { ...event?.data, request: { ...request, auth } }]);
                    }
                }
            };
            // const messageHandler = (event: MessageEvent) => {

            // };

            // channel.addEventListener("message", messageHandler);
            // return () => channel.removeEventListener("message", messageHandler);
        }
    }, [portal, provider]);

    useLayoutEffect(() => {
        if (strategy === "popup" && !path?.startsWith("/request") && !path?.startsWith("/lock") && !path?.startsWith("/welcome")) {
            const handleUnload = () => channel.postMessage({ target, close: true, error: "User rejected the request" });

            window.close();
            window.addEventListener("beforeunload", handleUnload);
            return () => window.removeEventListener("beforeunload", handleUnload);
        }
    }, [path]);

    const count = useMemo(() => messages?.filter((m) => m?.id !== current)?.length || 0, [messages]);

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
                remove(id);
                channel.postMessage({ target, id, result, method: message?.request.method, close: count === 1 });
                if (isProxy) portal?.document?.getElementById(`coinmeca-wallet-proxy-${id}`)?.remove();
            }
        },
        [messages, portal],
    );

    const failure = useCallback(
        (id: string, error: any) => {
            const message = messages?.find((m) => m?.id === id);
            if (message) {
                remove(id);
                channel.postMessage({ target, id, error, method: message?.request.method, close: true });
                if (isProxy) portal?.document?.getElementById(`coinmeca-wallet-proxy-${id}`)?.remove();
            }
        },
        [messages, portal],
    );

    const close = () => {
        if (portal) {
            if (telegram) telegram?.close();
            window?.close();
        } else router.push("/");
    };

    const next = useCallback(
        (id: string) => {
            if (isPopup) {
                if (count) {
                    const next = messages[(messages?.findIndex((m) => m?.id === id) + 1) % messages.length] || messages?.[0];
                    if (next.id !== id) {
                        router.push(`/request/${next?.request?.method}`);
                        return next.id;
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
                if (count) {
                    const prev = messages[(messages?.findIndex((m) => m?.id === id) - 1 + messages.length) % messages.length] || messages?.[0];
                    if (prev.id !== id) {
                        router.push(`/request/${prev?.request?.method}`);
                        return prev.id;
                    } else close();
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
                close,
                remove,
                current,
                setCurrent,
            }}>
            {children}
        </MessageHandlerContext.Provider>
    );
};
