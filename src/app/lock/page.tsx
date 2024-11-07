"use client";

import { useCoinmecaWallet } from "@coinmeca/wallet-sdk/context";
import { Stages } from "containers";
import { useRouter } from "next/navigation";

export default function Lock({ params }: { params: any }) {
    const router = useRouter();
    const { provider } = useCoinmecaWallet();

    const handleUnlock = (code: string) => {
        if (provider?.unlock(code)) router.push("/");
        else return new Error("The entered passcode was wrong.");
    };

    return <Stages.Lock onUnlock={handleUnlock} />;
}
