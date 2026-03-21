"use client";

import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { requestRoute } from "@coinmeca/wallet-sdk/utils";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo } from "react";
import { useMessageHandler } from "contexts/message";
import { Stages } from "containers";

export default function Lock(_: { params: any }) {
    const path = usePathname();
    const router = useRouter();

    const { provider } = useCoinmecaWalletProvider();
    const { current, getRequestById, messages } = useMessageHandler();
    const pendingRoute = useMemo(() => {
        const currentRoute = requestRoute(getRequestById(current)?.method);
        return currentRoute || requestRoute(messages?.[0]?.request?.method) || "/";
    }, [current, getRequestById, messages]);
    const allowReset = useMemo(() => {
        if (typeof window === "undefined") return false;
        const isEmbedded = window.parent !== window;
        const isPopup = !!window.opener;
        const hasPendingRequest = pendingRoute !== "/";
        return !isEmbedded && !isPopup && !hasPendingRequest;
    }, [pendingRoute]);

    useEffect(() => {
        if (!path?.startsWith("/lock")) return;
        void router.prefetch(pendingRoute);
    }, [path, pendingRoute, router]);

    useLayoutEffect(() => {
        if (!provider || !path?.startsWith("/lock")) return;
        if (provider.isLocked) return;
        router.replace(pendingRoute);
    }, [path, pendingRoute, provider, provider?.isLocked, router]);

    const handleUnlock = async (code: string) => {
        if (!provider) return false;
        try {
            if (await provider?.unlock(code)) {
                if (path?.startsWith("/lock")) {
                    router.replace(pendingRoute);
                }
                else if (!provider?.account()) {
                    const accounts = provider?.accounts();
                    if (accounts?.length) provider?.changeAccount(0);
                    else router.replace("/welcome");
                }
                return true;
            }
        } catch (error) {
            console.error(error);
            return false;
        }

        return false;
    };

    return <Stages.Lock onUnlock={handleUnlock} allowReset={allowReset} />;
}
