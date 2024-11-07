"use client";

import { Stages } from "containers";
import { useWallet } from "hooks";
import { useRouter } from "next/navigation";

export default function Lock({ params }: { params: any }) {
    const router = useRouter();
    const { provider } = useWallet();


    const handleUnlock = (code: string) => {
        provider?.unlock(code);
        console.log(provider?.isLocked)
        if (provider?.isLocked) return new Error("The entered passcode was wrong.");
        else router.push("/");
        // const key = storage?.get(`${storage?.get("userId")}:${CryptoJS.SHA256(code).toString()}`);
        // session?.set("key", key);
        // const wallets: any = storage?.get(`${key}:wallets`);

        // if (!wallets || !wallets.length) {
        //     storage?.remove("init");
        //     router.push("/welcome");
        // } else {
        //     const last: any = storage?.get("last:wallet");
        //     const info: any = storage?.get(wallet(wallets[last]).address?.toLowerCase());
        //     if (info) setAccount(info);

        //     const target = new URLSearchParams(window.location.search).get("target");
        //     if (target) router.push(target === "" || target === "%2F" || target?.startsWith("/welcome") ? "/" : (target?.startsWith("/") ? "" : "/") + target);
        //     else setIsAccess(true);
        //     // else router.push("/");
        // }
    };

    return <Stages.Lock onUnlock={handleUnlock} />;
}
