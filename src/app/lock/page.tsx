"use client";

import CryptoJS from "crypto-js";
import { useAccount, useStorage } from "hooks";
import { useRouter } from "next/navigation";
import { wallet } from "wallet";
import { Stages } from "containers";
import { useEffect } from "react";

export default function Lock({ params }:{params:any}) {
    const router = useRouter();
    const { storage, session } = useStorage();
    const { setAccount } = useAccount();

    const handleUnlock = (code: string) => {
        const key = storage?.get(`${storage?.get("userId")}:${CryptoJS.SHA256(code).toString()}`);
        session?.set("key", key);
        const wallets: any = storage?.get(`${key}:wallets`);

        if (!wallets || !wallets.length) {
            storage?.remove("init");
            router.push("/welcome");
        } else {
            const last: any = storage?.get("last:wallet");
            const info: any = storage?.get(wallet(wallets[last]).address);
            if (info) setAccount(info);
            router.push("/");
        }
    }


    useEffect(() => {
        console.log(params?.target)
    }, [])

    return <Stages.Lock onUnlock={handleUnlock} />
}
