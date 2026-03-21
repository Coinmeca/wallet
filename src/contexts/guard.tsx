"use client";

import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { usePathname } from "next/navigation";

interface GuardContextProps {
    isInit: boolean;
    isAccess: boolean;
    setIsAccess: React.Dispatch<React.SetStateAction<boolean>>;
    isLoad: boolean;
}

const GuardContext = createContext<GuardContextProps | undefined>(undefined);

export const useGuard = () => {
    const context = useContext(GuardContext);
    if (!context) throw new Error("GuardContext for useGuard doesn't initialized yet.");
    return context;
};

export const GuardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const path = usePathname();
    const { provider, account } = useCoinmecaWalletProvider();

    const [accessOverride, setAccessOverride] = useState<boolean>();

    const state = useMemo(() => {
        if (!provider) {
            return {
                isInit: false,
                isAccess: false,
                isLoad: false,
                target: undefined as string | undefined,
            };
        }

        const runtimeAccount = account || provider.account();
        const runtimeAddress = runtimeAccount?.address || provider.address;
        const isInit = !!provider.isInitialized || !!runtimeAddress;
        const setupRoute = !!(path?.startsWith("/welcome") || path?.startsWith("/recover"));
        const requestRoute = !!path?.startsWith("/request");
        const proxyRoute = !!path?.startsWith("/proxy");
        const lockRoute = !!path?.startsWith("/lock");
        const bridgeRoute = requestRoute || proxyRoute || lockRoute;
        const runtimeAccess = !!runtimeAccount || !provider.isLocked;
        const target = !isInit && !setupRoute && !bridgeRoute ? "/welcome" : undefined;
        const isAccess = isInit ? (proxyRoute ? true : runtimeAccess) : setupRoute || bridgeRoute;
        const isLoad = !target || target === path;

        return { isInit, isAccess, isLoad, target };
    }, [account, path, provider, provider?.address, provider?.isInitialized, provider?.isLocked]);

    useEffect(() => {
        setAccessOverride(undefined);
    }, [path, state.isInit, state.target, provider?.isLocked]);

    useLayoutEffect(() => {
        if (state.target && state.target !== path && typeof window !== "undefined") window.location.replace(state.target);
    }, [path, state.target]);

    const setIsAccess: React.Dispatch<React.SetStateAction<boolean>> = (value) => {
        setAccessOverride((previous) => {
            const current = typeof previous === "boolean" ? previous : state.isAccess;
            return typeof value === "function" ? value(current) : value;
        });
    };

    return (
        <GuardContext.Provider
            value={{
                isInit: state.isInit,
                isAccess: typeof accessOverride === "boolean" ? accessOverride : state.isAccess,
                isLoad: state.isLoad,
                setIsAccess,
            }}>
            {children}
        </GuardContext.Provider>
    );
};
