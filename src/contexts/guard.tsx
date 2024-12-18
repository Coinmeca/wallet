"use client";

import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { usePathname, useRouter } from "next/navigation";
import { Account } from "@coinmeca/wallet-sdk/types";

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
    const { provider } = useCoinmecaWalletProvider();

    const [isInit, setIsInit] = useState<boolean>(false);
    const [isAccess, setIsAccess] = useState<boolean>(false);
    const [isLoad, setIsLoad] = useState<boolean>(false);

    const [check, setCheck] = useState<any>();
    const [target, setTarget] = useState<string>();

    useLayoutEffect(() => {
        if (provider) {
            const handleCheck = (info?: Account) => {
                const check = {
                    init: provider?.isInitialized,
                    access: !!info || !provider?.isLocked,
                };

                if (typeof check.init !== "undefined" && typeof check.access !== "undefined") {
                    let target;

                    if (!check.init) {
                        if (path?.startsWith("/welcome")) setIsAccess(true);
                        else target = "/welcome";
                    } else {
                        setIsInit(true);
                        if (path?.startsWith("/proxy")) setIsAccess(true);
                        else setIsAccess(check.access);

                        // if (!check.access) {
                        // const request = window.location.pathname;
                        // const query = window.location.search;
                        // if (!path.startsWith("/lock") && path !== "/lock?" && path !== "/lock?target=")
                        //     target = `/lock?target=${encodeURIComponent(fullPath + queryString)}`;
                        // } else setIsAccess(true);
                    }

                    if (target) setTarget(target);
                    setCheck(check);
                }
            };

            handleCheck();
            provider?.on("unlock", handleCheck);
            return () => {
                provider?.off("unlock", handleCheck);
            };
        }
    }, [path, provider?.isInitialized, provider?.isLocked]);

    useLayoutEffect(() => {
        if (target && target !== path) {
            window.location.href = target;
            window.location.reload();
        }
    }, [target]);

    useLayoutEffect(() => {
        if ((target === path || !target) && !isLoad && check && Object.values(check).every((_) => typeof _ === "boolean")) setIsLoad(true);
    }, [path, target, check]);

    return <GuardContext.Provider value={{ isInit, isAccess, isLoad, setIsAccess }}>{children}</GuardContext.Provider>;
};
