"use client";

import CryptoJS from "crypto-js";
import { Layouts } from "@coinmeca/ui/components";
import { useEffect, useState } from "react";
import { Stages } from "containers";
import { useRouter } from "next/navigation";

export default function Reset() {
    const router = useRouter();
    const [stage, setStage] = useState({ name: "lock", level: 0 });
    const [code, setCode] = useState("");

    const handleUnlock = (code: string) => {
        // const key = storage?.get(`${storage?.get("userId")}:${CryptoJS.SHA256(code).toString()}`);
        // session?.set("key", key);
        // const wallets: any = storage?.get(`${key}:wallets`);
        // if (!wallets || !wallets.length) {
        //     storage?.remove("init");
        //     router.push("/welcome");
        //     setCode('');
        // } else {
        //     setCode(code);
        //     setStage({ name: "init", level: 0 });
        // }
    };

    const handleConfirm = (passcode: string) => {
        // if (code === passcode) {
        //     // error
        // }
        // const userId = storage?.get("userId");
        // if (!userId) {
        //     // error
        // }
        // const seed = CryptoJS.SHA256(passcode).toString();
        // const legacy = `${userId}:${CryptoJS.SHA256(code).toString()}`
        // storage?.set(`${userId}:${seed}`, storage?.get(legacy));
        // storage?.remove(legacy);
        // setCode("");
        // router.push('/');
        return true;
    };

    useEffect(() => {
        return () => setCode("");
    }, []);

    return (
        <Layouts.Contents.SlideContainer
            key="reset"
            contents={[
                {
                    active: stage.name === "lock",
                    children: <Stages.Lock onUnlock={handleUnlock} />,
                },
                {
                    active: stage.name === "init",
                    children: <Stages.Init stage={stage} setStage={setStage} exit={"lock"} onConfirm={handleConfirm} reset />,
                },
            ]}
        />
    );
}
