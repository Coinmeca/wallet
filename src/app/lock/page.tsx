"use client";

import { useCoinmecaWalletProvider } from "@coinmeca/wallet-sdk/contexts";
import { Stages } from "containers";
import { useRouter } from "next/navigation";

export default function Lock({ params }: { params: any }) {
    const router = useRouter();
    const { provider } = useCoinmecaWalletProvider();

    const handleUnlock = (code: string) => {
        if (!provider?.unlock(code)) return new Error("The entered passcode was wrong.");
    };

    return <Stages.Lock onUnlock={handleUnlock} />;
}
