"use client";
import { Frames } from "@coinmeca/ui/containers";
import Data from "./data";
import { useAccount, useTelegram } from "hooks";
import { useLayoutEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Flows } from "index";

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

        const session = sessionStorage.getItem("session");
        const init = (telegram && user?.id ? telegram.CloudStorage : localStorage)?.getItem("init");
        const key = sessionStorage.getItem("key");

        if (!session) setSession(true);
        if (!init) router.push("/welcome");
        else if (!key || !session) {
            setInit(true);
            router.push("/lock");
        }
        return () => window.removeEventListener("beforeunload", handleTabClose);
    }, []);

    const Children = useMemo(() => (init ? session && account ? children : <Flows.Lock /> : <Flows.Welcome />), [session, account]);

    return (
        <Frames.Frame
            // header={header}
            // align={"right"}
            background={{ img: { src: 2 } }}
            // side={56}
        >
            {/* <AnimatePresence> */}
            {Children}
            {/* </AnimatePresence> */}
        </Frames.Frame>
    );
}
