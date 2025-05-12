"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export interface PageLoader {
    isLoad: boolean;
    isRequest: boolean;
    isProxy: boolean;
    isMenu: boolean;
}

export function usePageLoader():PageLoader {
    const path = usePathname();
    const [isLoad, setIsLoad] = useState(false);

    useEffect(() => {
        setIsLoad(true);
        return () => setIsLoad(false);
    }, []);

    const isRequest = useMemo(() => path?.startsWith("/request"), [path]);
    const isProxy = useMemo(() => path?.startsWith("/proxy"), [path]);
    const isMenu = useMemo(() => path === ("/") || path?.startsWith("/token") || path?.startsWith("/nft") || path?.startsWith("/activity"), [path, isRequest, isProxy])

    return { isLoad, isRequest, isProxy, isMenu };
}
