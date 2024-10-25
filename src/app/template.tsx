"use client";
import { Frames } from "@coinmeca/ui/containers";
import Data from "./data";
import { useAccount, useStorage } from "hooks";
import { useLayoutEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface CoinmecaWallet {
    isCoinmecaWallet: boolean;
    name: string;
}

export default function RootTemplate({ children }: { children: any }) {
    const router = useRouter();
    const path = usePathname();

    const { account } = useAccount();
    const { storage, session } = useStorage();
    const { header } = Data();

    const [init, setInit] = useState(false);
    const [access, setAccess] = useState(false);

    useLayoutEffect(() => {
        const handleTabClose = () => session?.remove("key");
        window.addEventListener("beforeunload", handleTabClose);

        const init = storage?.get("init");
        const key = session?.get("key");

        // console.log({ init, access });

        console.log(init, key)

        if (!path.startsWith("/welcome"))
            if (!init) router.push("/welcome");
            else {
                setInit(true);
                if (!path.startsWith("/lock"))
                    if (!key) router.push("/lock");
                    else setAccess(true);
            }

        console.log({ account });

        return () => window.removeEventListener("beforeunload", handleTabClose);
    }, []);

    return (
        <Frames.Frame
            header={header}
            // align={"right"}
            background={{ img: { src: 2 } }}
            // side={56}
        >
            {children}
            {/* {init && access && children} */}
        </Frames.Frame>
    );
}
