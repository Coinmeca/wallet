"use client";

import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { MessageRequest, useMessageHandler } from "contexts/message";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";

export interface RequestProps {
    load: boolean;
    id: string;
    setId: React.Dispatch<React.SetStateAction<string>>;
    request: MessageRequest;
}

export function useRequest(method: string): RequestProps {
    const path = usePathname();
    const router = useRouter();
    const { provider } = useCoinmecaWalletProvider();

    const { current, getRequest, getRequestById, setCurrent } = useMessageHandler();

    const [id, setId] = useState("");
    const request = useMemo(() => {
        if (!id) return {} as MessageRequest;
        const next = getRequestById(id);
        return next?.method ? next : ({} as MessageRequest);
    }, [getRequestById, id]);
    const isLockRoute = !!path?.startsWith("/lock");
    const isProxyRoute = !!path?.startsWith("/proxy/request");
    const blockedByLock = !!id && !!provider?.isLocked && !isLockRoute && !isProxyRoute;
    const load = !!provider && !!id && !!request?.method && !blockedByLock;

    useEffect(() => {
        if (!id) return;
        setCurrent(id);
    }, [id, setCurrent]);

    useLayoutEffect(() => {
        const activeMethod = getRequestById(id)?.method;
        const selectedMethod = getRequestById(current)?.method;
        if (current && selectedMethod?.toLowerCase() === method?.toLowerCase() && current !== id) {
            setId(current);
            return;
        }
        if (id && activeMethod?.toLowerCase() === method?.toLowerCase()) return;
        const next = getRequest(method)?.id || "";
        if (next !== id) setId(next);
    }, [current, getRequest, getRequestById, id, method]);

    useLayoutEffect(() => {
        if (!id || !provider?.isLocked) return;
        if (isProxyRoute || isLockRoute) return;
        router.replace("/lock");
    }, [id, isLockRoute, isProxyRoute, provider?.isLocked, router]);

    return { load, id, setId, request };
}
