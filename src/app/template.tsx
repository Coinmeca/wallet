"use client";
import { Frames } from "@coinmeca/ui/containers";
import Data from "./data";
import { useAccount, useTelegram } from "hooks";
import { useLayoutEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Flows } from "index";
import { AnimatePresence } from "framer-motion";

interface CoinmecaWallet {
    isCoinmecaWallet: boolean;
    name: string;
}

export default function RootTemplate({ children }: { children: any }) {
    const router = useRouter();

    const { account } = useAccount();
    const { telegram, user } = useTelegram();
    const { header } = Data();

    const [init, setInit] = useState(false);
    const [session, setSession] = useState(false);

    useLayoutEffect(() => {        
        const handleTabClose = () => sessionStorage.removeItem("key");
        window.addEventListener("beforeunload", handleTabClose);
        
        const storage = telegram && user?.id ? telegram.CloudStorage : localStorage;
        const init = storage?.getItem("init");
        const userId = storage.getItem(`userId`);

        const session = sessionStorage.getItem("key");

        console.log({ init, session });

        if (!init) router.push("/welcome");
        else {
            setInit(true);
            if (!session) router.push("/lock");
            else setSession(true);
        }

        return () => window.removeEventListener("beforeunload", handleTabClose);
    }, []);

    return (
        <Frames.Frame
            header={header}
            // align={"right"}
            background={{ img: { src: 2 } }}
            // side={56}
        >
            {init ? session ? children : <Flows.Lock /> : <Flows.Welcome />}
        </Frames.Frame>
    );
}
