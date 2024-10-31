"use client";

import { useLayoutEffect } from "react";
import { Frames } from "@coinmeca/ui/containers";
import { Contents, Layouts } from "@coinmeca/ui/components";
import { AnimatePresence } from "framer-motion";

import { useGuard, useStorage } from "hooks";
import { Containers } from "index";
import Data from "./data";

export default function RootTemplate({ children, params }: { children: any; params: any }) {
    const { isLoad } = useGuard();
    const { session } = useStorage();
    const { header, toastlist } = Data();

    useLayoutEffect(() => {
        const handleTabClose = () => session?.remove("key");
        window.addEventListener("beforeunload", handleTabClose);
        return () => window.removeEventListener("beforeunload", handleTabClose);
    }, []);

    return (
        <Frames.Frame
            header={{ type: "custom", children: <Containers.Header {...header} /> }}
            align={"right"}
            background={{ img: { src: 2 } }}
            side={56}
            toast={toastlist}>
            <Layouts.Page>
                <AnimatePresence>
                    {isLoad ? (
                        children
                    ) : (
                        <Contents.States.Loading
                            style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1000, background: "black" }}
                        />
                    )}
                </AnimatePresence>
            </Layouts.Page>
        </Frames.Frame>
    );
}
