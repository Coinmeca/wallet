"use client";

import { Contents, Layouts } from "@coinmeca/ui/components";
import { Frames } from "@coinmeca/ui/containers";
import { AnimatePresence } from "framer-motion";

import { useGuard, usePageLoader } from "hooks";
import { Containers } from "index";
import Data from "./data";
import Lock from "./lock/page";
import Main from "./page";
import { useMemo } from "react";

export default function RootTemplate({ children, params }: any) {
    const page = usePageLoader();
    const { header, sidebars, side, toastlist } = Data(page);
    const { isLoad, isAccess } = useGuard();

    const contents = useMemo(() => (isAccess ? page.isMenu ? <Main /> : children : <Lock params={{}} />), [isAccess, page, children]);

    return isLoad ? (
        <Frames.Frame
            header={{ type: "custom", children: <Containers.Header {...header} /> }}
            sidebar={sidebars}
            side={side}
            align={"right"}
            background={{ img: { src: 2 } }}
            // background={{ img: { src: 2 }, filter: { color: "black", opacity: 0.3 } }}
            toast={toastlist}>
            <Layouts.Page>
                <AnimatePresence>{contents}</AnimatePresence>
            </Layouts.Page>
        </Frames.Frame>
    ) : (
        <Contents.States.Loading style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 10000, background: "black" }} />
    );
}
