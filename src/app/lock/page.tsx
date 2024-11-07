"use client";

import { Stages } from "containers";
import { useWallet } from "hooks";
import { useRouter } from "next/navigation";

export default function Lock({ params }: { params: any }) {
    const router = useRouter();
    const { provider } = useWallet();


    const handleUnlock = (code: string) => {
        if (provider?.unlock(code)) router.push("/");
        else return new Error("The entered passcode was wrong.");
    };

    return <Stages.Lock onUnlock={handleUnlock} />;
}
