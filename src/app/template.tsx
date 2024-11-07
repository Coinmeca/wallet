"use client";

import { Frames } from "@coinmeca/ui/containers";
import { Contents, Layouts } from "@coinmeca/ui/components";
import { AnimatePresence } from "framer-motion";

import { useGuard } from "hooks";
import { Containers } from "index";
import Data from "./data";
import Lock from "./lock/page";

export default function RootTemplate({ children, params }: { children: any; params: any }) {
    const { header, toastlist } = Data();
    const { isLoad, isAccess } = useGuard();

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
                        isAccess ? (
                            children
                        ) : (
                            <Lock params={{}} />
                        )
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
