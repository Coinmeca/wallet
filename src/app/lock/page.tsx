"use client";

import CryptoJS from "crypto-js";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { usePathname, useRouter } from "next/navigation";
import { Stages } from "containers";

export default function Lock({ params }: { params: any }) {
    const path = usePathname();
    const router = useRouter();

    const { provider } = useCoinmecaWalletProvider();

    const handleUnlock = (code: string) => {
        try {
            if (provider?.unlock(CryptoJS.SHA256(code).toString())) {
                code = "";
                if (path?.startsWith("/lock")) router.push("/");
                else if (!provider?.account()) {
                    if (provider?.accounts()?.length) provider?.changeAccount(0);
                    else router.push("/welcome");
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    return <Stages.Lock onUnlock={handleUnlock} />;
}
