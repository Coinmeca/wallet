import { useStorage } from "hooks";
import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useContext, useLayoutEffect, useMemo, useState } from "react";

interface GuardContextProps {
    isInit: boolean;
    isAccess: boolean;
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
    const router = useRouter();
    const { storage, session } = useStorage();

    const [isInit, setIsInit] = useState<boolean>(false);
    const [isAccess, setIsAccess] = useState<boolean>(false);
    const [check, setCheck] = useState<any>();
    const [target, setTarget] = useState<string>();

    useLayoutEffect(() => {
        if (storage && session) {
            const check = {
                init: !!storage?.get("init"),
                access: !!session?.get("key"),
            };

            if (typeof check.init !== "undefined" && typeof check.access !== "undefined") {
                let target;

                const fullPath = window.location.pathname;
                const queryString = window.location.search;

                if (!check.init) {
                    if (!path?.startsWith("/welcome")) target = "/welcome";
                } else {
                    setIsInit(true);
                    if (!check.access) {
                        if (!path.startsWith("/lock") && path !== "/lock?" && path !== "/lock?target=")
                            target = `/lock?target=${encodeURIComponent(fullPath + queryString)}`;
                    } else setIsAccess(true);
                }

                if (target) setTarget(target);
                setCheck(check);
            }
        }
    }, [path, storage, session]);

    useLayoutEffect(() => {
        if (target) router.push(target);
    }, [target]);

    useLayoutEffect(() => {
        if (!path?.startsWith("/lock")) {
            if (typeof window !== "undefined" && (window as any)?.coinmeca?.isPopup) {
                const handleUnload = () => {
                    window?.opener?.postMessage(
                        {
                            close: true,
                            error: "User rejected the request",
                        },
                        "*",
                    );
                };

                window.addEventListener("beforeunload", handleUnload);
                return () => window.removeEventListener("beforeunload", handleUnload);
            }
        }
    }, [path]);

    const isLoad = useMemo(() => {
        if (typeof check?.init !== "boolean" && typeof check?.access !== "boolean") return false;
        if (check.init && check.access) return true;
        else if (!check.init && path?.startsWith("/welcome")) return true;
        else if (!check.access && path?.startsWith("/lock")) return true;
        return false;
    }, [path, check]);

    return <GuardContext.Provider value={{ isInit, isAccess, isLoad }}>{children}</GuardContext.Provider>;
};
