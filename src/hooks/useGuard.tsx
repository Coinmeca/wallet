import { useStorage } from "hooks";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useState } from "react";

export function useGuard(): {
    isInit?: boolean;
    isAccess?: boolean;
    isLoad?: boolean;
} {
    const path = usePathname();
    const { storage, session } = useStorage();

    const [isInit, setIsInit] = useState(false);
    const [isAccess, setIsAccess] = useState(false);
    const [isLoad, setIsLoad] = useState(false);

    useLayoutEffect(() => {
        const init = storage?.get("init");
        const key = session?.get("key");

        if (init) {
            setIsInit(true);
            if (key) setIsAccess(true);
        }
    }, [path]);

    return {isInit, isAccess, isLoad}
};