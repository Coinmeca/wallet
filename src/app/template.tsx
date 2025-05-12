"use client";

import { useMemo } from "react";
import { Contents, Layouts } from "@coinmeca/ui/components";
import { Frames } from "@coinmeca/ui/containers";
import { AnimatePresence } from "framer-motion";

import { useGuard, usePageLoader } from "hooks";
import { Containers } from "index";
import Data from "./data";
import Lock from "./lock/page";
import Main from "./page";

export default function RootTemplate({ children, params }: any) {
    const page = usePageLoader();
    const { isLoad, isAccess } = useGuard();

    const data = Data(page);
    const { header, sidebars, side, toastlist } = useMemo(() => data, [data]);

    return isLoad ? (
        <>
            <Frames.Frame
                header={{ type: "custom", children: <Containers.Header {...header} /> }}
                sidebar={sidebars}
                side={side}
                align={"right"}
                background={{ img: { src: 2 } }}
                toast={toastlist}>
                <Layouts.Page>
                    <AnimatePresence>{isAccess ? page.isMenu ? <Main /> : children : <Lock params={{}} />}</AnimatePresence>
                </Layouts.Page>
            </Frames.Frame>
        </>
    ) : (
        <Contents.States.Loading style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 10000, background: "black" }} />
    );
}
