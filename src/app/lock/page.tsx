"use client";

import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { Stages } from "containers";
import { usePathname, useRouter } from "next/navigation";

export default function Lock({ params }: { params: any }) {
    const path = usePathname();
    const router = useRouter();

    const { provider } = useCoinmecaWalletProvider();

    const handleUnlock = (code: string) => {
        try {
            if (provider?.unlock(code)) {
                if (path?.startsWith("/lock")) router.push("/");
            }
        } catch (e) {
            console.error(e);
        }
    };

    return <Stages.Lock onUnlock={handleUnlock} />;
}
