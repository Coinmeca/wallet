"use client";

import { App } from "@coinmeca/wallet-sdk/types";
import { requestRoute } from "@coinmeca/wallet-sdk/utils";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { useTelegram } from "@coinmeca/wallet-provider/telegram";
import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from "react";

export type MessageStrategy = "modal" | "popup" | "proxy";

export interface MessageRequest {
    method: string | undefined;
    params: any;
    chainId: number | undefined;
    app: App | undefined;
}

export interface MessageProps {
    id: string;
    nonce: string;
    strategy: MessageStrategy | undefined;
    request: MessageRequest;
    origin: string;
    time: number;
}

export interface MessageHandlerProps {
    strategy: MessageStrategy | undefined;
    isModal: boolean;
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
    close: (id?: string) => void;
    remove: (id: string) => void;
    current: string;
    setCurrent: React.Dispatch<React.SetStateAction<string>>;
}

const target = "coinmeca-wallet";

const isRequest = (data: any) => {
    return !!(
        data &&
        data?.target === target &&
        typeof data?.id === "string" &&
        data.id.trim() !== "" &&
        data?.request &&
        typeof data?.request?.method === "string" &&
        data.request.method.trim() !== "" &&
        typeof data?.result === "undefined" &&
        typeof data?.error === "undefined" &&
        typeof data?.close === "undefined"
    );
};

const sameOrigin = (left?: string, right?: string) => {
    if (!left || !right) return false;
    try {
        return new URL(left).origin === new URL(right).origin;
    } catch {
        return false;
    }
};

const requestApp = (value: any, origin: string): App | undefined => {
    if (!origin) return;
    const trusted = value && typeof value === "object" && sameOrigin(value?.url, origin);
    return {
        ...(trusted && typeof value?.name === "string" && value.name.trim() ? { name: value.name.trim() } : {}),
        ...(trusted && typeof value?.logo === "string" && value.logo.trim() ? { logo: value.logo.trim() } : {}),
        url: origin,
    } as App;
};

const hasImportedState = (value: any) =>
    !!(value && typeof value === "object" && !Array.isArray(value) && value?.schema === 6 && value?.data && typeof value.data === "object");

const MessageHandlerContext = createContext<MessageHandlerProps | undefined>(undefined);

export const useMessageHandler = () => {
    const context = useContext(MessageHandlerContext);
    if (!context) throw new Error("MessageHandler for useMessage doesn't initialized yet.");
    return context;
};

export const MessageHandler: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const path = usePathname();
    const router = useRouter();

    const { provider } = useCoinmecaWalletProvider();
    const { telegram } = useTelegram();
    const [portal, setPortal] = useState<Window | undefined>();
    const [messages, setMessages] = useState<MessageProps[]>([]);
    const [strategy, setStrategy] = useState<MessageStrategy>();
    const [current, setCurrent] = useState<string>("");

    const messagesRef = useRef<MessageProps[]>([]);
    const strategyRef = useRef<MessageStrategy>();

    messagesRef.current = messages;
    strategyRef.current = strategy;

    const isModal = useMemo(() => strategy === "modal", [strategy]);
    const isPopup = useMemo(() => strategy === "popup", [strategy]);
    const isProxy = useMemo(() => strategy === "proxy", [strategy]);

    useLayoutEffect(() => {
        setPortal(window?.opener || (window?.parent !== window ? window.parent : undefined));
    }, []);

    useLayoutEffect(() => {
        if (!portal) return;

        const announceReady = () => {
            try {
                portal.postMessage({ target, state: "ready" }, "*");
            } catch { }
        };

        announceReady();
        const readyInterval = setInterval(() => {
            if ((portal as any)?.closed) {
                clearInterval(readyInterval);
                return;
            }
            announceReady();
        }, 250);

        const messageHandler = (event: MessageEvent) => {
            if (event.source !== portal) return;
            if (!isRequest(event?.data)) return;

            clearInterval(readyInterval);
            if (hasImportedState(event?.data?.storage)) provider?.importState?.(event.data.storage);

            const { id, request } = event.data;
            if (messagesRef.current?.find((message) => message?.id?.toLowerCase().trim() === id?.toLowerCase().trim())) return;

            const nextStrategy = event?.data?.strategy as MessageStrategy | undefined;
            const activeStrategy = nextStrategy || strategyRef.current;
            const nextRoute = requestRoute(request?.method, activeStrategy === "proxy" ? "proxy" : "request");
            const app = requestApp(request?.app, event.origin);

            if (!strategyRef.current && nextStrategy) {
                strategyRef.current = nextStrategy;
                setStrategy(nextStrategy);
            }

            if (nextRoute) {
                void router.prefetch(nextRoute);
                if (!messagesRef.current.length && path !== nextRoute && !provider?.isLocked) router.push(nextRoute);
            }
            setMessages((state) => [
                ...(state || []),
                {
                    ...event.data,
                    nonce: typeof event?.data?.nonce === "string" ? event.data.nonce : "",
                    origin: event.origin,
                    request: { ...request, app },
                },
            ]);
        };

        window.addEventListener("message", messageHandler);
        return () => {
            clearInterval(readyInterval);
            window.removeEventListener("message", messageHandler);
        };
    }, [path, portal, provider, router]);

    useLayoutEffect(() => {
        if (strategy === "popup" && !path?.startsWith("/request") && !path?.startsWith("/lock") && !path?.startsWith("/welcome")) {
            const handleUnload = () => {
                const message = messagesRef.current?.find((item) => item?.id === current) || messagesRef.current?.[0];
                if (!message?.origin) return;

                portal?.postMessage(
                    {
                        target,
                        id: message.id,
                        nonce: message.nonce,
                        method: message?.request.method,
                        close: true,
                        error: "User rejected the request",
                    },
                    message.origin,
                );
            };

            window.close();
            window.addEventListener("beforeunload", handleUnload);
            return () => window.removeEventListener("beforeunload", handleUnload);
        }
    }, [current, path, portal, strategy]);

    const count = useMemo(() => messages?.filter((message) => message?.id !== current)?.length || 0, [current, messages]);

    const getRequest = useCallback(
        (method: string) => messages?.find((message) => message?.request?.method?.toLowerCase() === method?.toLowerCase()) || ({} as MessageProps),
        [messages],
    );

    const getRequestById = useCallback(
        (id?: string) =>
            (id &&
                messages?.find(
                    (message) =>
                        message?.id?.toLowerCase() === id?.toLowerCase() ||
                        (typeof message?.id === "string" &&
                            typeof message?.nonce === "string" &&
                            `${message.id}:${message.nonce}`.toLowerCase() === id.toLowerCase()),
                )?.request) ||
            ({} as MessageRequest),
        [messages],
    );

    const remove = useCallback((id: string) => setMessages((state) => state?.filter((message) => message?.id !== id)), []);

    const success = useCallback(
        (id: string, result: any) => {
            const message = messages?.find((item) => item?.id === id);
            if (!message) return;

            remove(id);
            portal?.postMessage(
                {
                    target,
                    id,
                    nonce: message.nonce,
                    result,
                    method: message?.request.method,
                    close: isProxy,
                },
                message.origin,
            );
        },
        [isProxy, messages, portal, remove],
    );

    const failure = useCallback(
        (id: string, error: any) => {
            const message = messages?.find((item) => item?.id === id);
            if (!message) return;

            remove(id);
            portal?.postMessage(
                {
                    target,
                    id,
                    nonce: message.nonce,
                    error,
                    method: message?.request.method,
                    close: isProxy,
                },
                message.origin,
            );
        },
        [isProxy, messages, portal, remove],
    );

    const focus = (message?: MessageProps) => {
        if (!message?.id) return;
        setCurrent(message.id);

        const route = requestRoute(message?.request?.method);
        if (route && path !== route) router.push(route);
    };

    const close = (id?: string) => {
        if (!portal) {
            router.replace("/");
            return;
        }

        const state = messagesRef.current || [];
        const closing = id ? state.filter((message) => message?.id === id) : state;
        const closingIds = new Set(closing.map((message) => message?.id).filter((value): value is string => !!value));
        const remaining = state.filter((message) => !closingIds.has(message?.id));

        closing.forEach((message) => {
            if (message?.origin) {
                portal?.postMessage(
                    {
                        target,
                        id: message.id,
                        nonce: message.nonce,
                        strategy,
                        method: message?.request.method,
                        close: true,
                    },
                    message.origin,
                );
            }
            remove(message.id);
        });

        if (!remaining.length) {
            portal.postMessage({ target, strategy, close: true }, "*");
            if (isPopup) {
                if (telegram) telegram?.close();
                window?.close();
            }
            return;
        }

        if (!isProxy) {
            const nextMessage = id ? remaining[0] : undefined;
            focus(nextMessage);
        }
    };

    const next = useCallback(
        (id: string) => {
            if (!isProxy) {
                if (count) {
                    const nextMessage = messages[(messages?.findIndex((message) => message?.id === id) + 1) % messages.length] || messages?.[0];
                    const route = requestRoute(nextMessage?.request?.method);
                    if (nextMessage?.id !== id) {
                        if (!route) {
                            close(id);
                            return;
                        }
                        router.push(route);
                        return nextMessage.id;
                    }
                    close(id);
                } else close(id);
            }
            if (!strategy) close();
        },
        [close, count, isProxy, messages, router, strategy],
    );

    const prev = useCallback(
        (id: string) => {
            if (!isProxy) {
                if (count) {
                    const prevMessage = messages[(messages?.findIndex((message) => message?.id === id) - 1 + messages.length) % messages.length] || messages?.[0];
                    const route = requestRoute(prevMessage?.request?.method);
                    if (prevMessage?.id !== id) {
                        if (!route) {
                            close(id);
                            return;
                        }
                        router.push(route);
                        return prevMessage.id;
                    }
                    close(id);
                } else close(id);
            }
            if (!strategy) close();
        },
        [close, count, isProxy, messages, router, strategy],
    );

    return (
        <MessageHandlerContext.Provider
            value={{
                strategy,
                isModal,
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
