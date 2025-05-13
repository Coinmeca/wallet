"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { AnimatePresence, motion } from "framer-motion";

import { useMessageHandler } from "hooks";
import { short } from "utils";

/*
await window.ethereum.providerMap.get("CoinmecaWallet").request({method: 'eth_requestAccounts'})
*/

const method = "eth_requestAccounts";
const timeout = 5000;

export default function Page() {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { provider, account } = useCoinmecaWalletProvider();
    const { getRequest, getRequestById, success, failure, next, count, setCurrent, messages, close } = useMessageHandler();

    const [load, setLoad] = useState(true);
    const [id, setId] = useState("");
    const [level, setLevel] = useState(0);
    const [error, setError] = useState<any>();

    const { app } = useMemo(() => getRequestById(id), [id]);

    const handleClose = () => {
        if (level === 0) failure(id, "User rejected the request");
        close(id);
    };

    const handleConnect = async () => {
        await provider
            ?.requestAccounts(app!)
            .then((result) => {
                success(id, result);
                setLevel(1);
                if (count <= 1) timeoutRef.current = setTimeout(handleClose, timeout);
            })
            .catch((error) => {
                console.log(error);
                failure(id, error);
                setError(error);
                setLevel(2);
            });
    };

    useEffect(() => {
        if (count && timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, [count]);

    useEffect(() => {
        if (id && id !== "") {
            setLoad(false);
            setCurrent(id);
            setError(undefined);
            setLevel(0);
            setTimeout(() => setLoad(true), 300);
        }
    }, [id]);

    useLayoutEffect(() => {
        const test = getRequest(method);
        const id = test?.id;
        setId(id);
    }, []);

    return (
        <AnimatePresence>
            {load &&
                (app ? (
                    <Layouts.Contents.SlideContainer
                        contents={[
                            {
                                active: true,
                                children: (
                                    <Layouts.Contents.InnerContent scroll={false}>
                                        <Layouts.Col gap={2} align={"center"} fill>
                                            {/* Content omitted for brevity */}
                                            <Layouts.Contents.InnerContent padding={[4, 4, 0]}>
                                                <Layouts.Col fill>
                                                    <Layouts.Col align={"center"} style={{ flex: 1 }}>
                                                        <Layouts.Col gap={8} align={"center"} fit>
                                                            <div
                                                                style={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    maxWidth: "max-content",
                                                                    maxHeight: "max-content",
                                                                    padding: "2em",
                                                                    borderRadius: "100%",
                                                                    background: "rgba(var(--white),.15)",
                                                                }}>
                                                                <Image
                                                                    width={0}
                                                                    height={0}
                                                                    src={
                                                                        level === 0
                                                                            ? app?.logo || ""
                                                                            : require(`../../../assets/animation/${level === 1 ? "success" : "failure"}.gif`)
                                                                    }
                                                                    alt={app?.name || "Unknown"}
                                                                    style={{ width: "8em", height: "8em" }}
                                                                />
                                                            </div>
                                                            <Layouts.Col gap={1}>
                                                                <Elements.Text type={"h6"}>{app?.name || ""}</Elements.Text>
                                                                <Elements.Text type={"strong"} opacity={0.6}>
                                                                    {app?.url}
                                                                </Elements.Text>
                                                            </Layouts.Col>
                                                        </Layouts.Col>
                                                    </Layouts.Col>
                                                    {/* <Layouts.Col gap={8} align={"center"} style={{ flex: 1 }} fill> */}
                                                    <Layouts.Contents.SlideContainer
                                                        style={{ flex: 1 }}
                                                        contents={[
                                                            {
                                                                active: level === 0,
                                                                children: (
                                                                    <Layouts.Col gap={0} align={"center"} style={{ height: "100%" }} fill>
                                                                        <Layouts.Col gap={4} align={"center"} fit>
                                                                            <Elements.Text type={"h3"}>Connect</Elements.Text>
                                                                            <Elements.Text size={1} weight={"bold"}>
                                                                                <Elements.Text opacity={0.6}>Connect</Elements.Text>{" "}
                                                                                <Elements.Text>{account?.name}</Elements.Text>{" "}
                                                                                <Elements.Text opacity={0.6}>({short(account?.address)}) to</Elements.Text>{" "}
                                                                                <Elements.Text>{app?.name}</Elements.Text>{" "}
                                                                                <Elements.Text opacity={0.6}>
                                                                                    ({app?.url}). Please check out the information of app and allow connections
                                                                                    only to apps you trust.
                                                                                </Elements.Text>
                                                                            </Elements.Text>
                                                                        </Layouts.Col>
                                                                    </Layouts.Col>
                                                                ),
                                                            },
                                                            {
                                                                active: level === 1,
                                                                children: (
                                                                    <Layouts.Col gap={0} align={"center"} style={{ height: "100%" }} fill>
                                                                        <Layouts.Col gap={4} align={"center"} fit>
                                                                            <Elements.Text type={"h3"}>Approved</Elements.Text>
                                                                            <Elements.Text size={1} weight={"bold"}>
                                                                                <Elements.Text opacity={0.6}>Complete to connect</Elements.Text>{" "}
                                                                                <Elements.Text>{account?.name}</Elements.Text>{" "}
                                                                                <Elements.Text opacity={0.6}>({short(account?.address)}) to</Elements.Text>{" "}
                                                                                <Elements.Text>{app?.name}</Elements.Text>{" "}
                                                                                <Elements.Text opacity={0.6}>({app?.url}).</Elements.Text>
                                                                            </Elements.Text>
                                                                        </Layouts.Col>
                                                                    </Layouts.Col>
                                                                ),
                                                            },
                                                            {
                                                                active: level === 2,
                                                                children: (
                                                                    <Layouts.Col gap={0} align={"center"} style={{ height: "100%" }} fill>
                                                                        <Layouts.Col gap={4} align={"center"} fit>
                                                                            <Elements.Text type={"h3"}>Failure</Elements.Text>
                                                                            <Elements.Text weight={"bold"} opacity={0.6}>
                                                                                {error?.message || error}
                                                                            </Elements.Text>
                                                                        </Layouts.Col>
                                                                    </Layouts.Col>
                                                                ),
                                                            },
                                                        ]}
                                                    />
                                                    {/* </Layouts.Col> */}
                                                </Layouts.Col>
                                            </Layouts.Contents.InnerContent>
                                            <Layouts.Col gap={4} align={"center"} style={{ padding: "4em", paddingTop: 0 }}>
                                                <Layouts.Contents.SlideContainer
                                                    contents={[
                                                        {
                                                            active: level === 0,
                                                            children: (
                                                                <Layouts.Row gap={2}>
                                                                    <Controls.Button type={"glass"} onClick={handleClose}>
                                                                        Cancel
                                                                    </Controls.Button>
                                                                    <Controls.Button type={"line"} onClick={handleConnect}>
                                                                        Approve
                                                                    </Controls.Button>
                                                                </Layouts.Row>
                                                            ),
                                                        },
                                                        {
                                                            active: level > 0,
                                                            children: (
                                                                <Layouts.Row gap={2}>
                                                                    <Controls.Button type={count ? undefined : "glass"} onClick={handleClose}>
                                                                        Close
                                                                    </Controls.Button>
                                                                    <AnimatePresence>
                                                                        {!!count && (
                                                                            <motion.div
                                                                                initial={{ flex: 0, marginLeft: "-2em", maxWidth: 0 }}
                                                                                animate={{ flex: 2, marginLeft: 0, maxWidth: "100vw" }}
                                                                                exit={{ flex: 2, marginLeft: 0, maxWidth: "100vw" }}
                                                                                transition={{ ease: "easeInOut", duration: 0.3 }}>
                                                                                <Controls.Button
                                                                                    type={"glass"}
                                                                                    onClick={() => setId(next(id) || "")}
                                                                                    style={{ width: "100%" }}>
                                                                                    See Next Request
                                                                                </Controls.Button>
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </Layouts.Row>
                                                            ),
                                                        },
                                                    ]}
                                                />
                                            </Layouts.Col>
                                        </Layouts.Col>
                                    </Layouts.Contents.InnerContent>
                                ),
                            },
                        ]}
                    />
                ) : (
                    <Layouts.Contents.InnerContent scroll={false}>
                        <Layouts.Col gap={2} align={"center"} fill>
                            <Layouts.Contents.InnerContent padding={[4, 4, 0]}>
                                <Layouts.Col fill>
                                    <Layouts.Col align={"center"} style={{ flex: 1 }}>
                                        <Layouts.Col gap={8} align={"center"} fit>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    maxWidth: "max-content",
                                                    maxHeight: "max-content",
                                                    padding: "2em",
                                                    borderRadius: "100%",
                                                    background: "rgba(var(--white),.15)",
                                                }}>
                                                <Image
                                                    width={0}
                                                    height={0}
                                                    src={require("../../../assets/animation/failure.gif")}
                                                    alt={"Unknown"}
                                                    style={{ width: "8em", height: "8em" }}
                                                />
                                            </div>
                                        </Layouts.Col>
                                    </Layouts.Col>
                                    <Layouts.Col gap={8} align={"center"} style={{ flex: 1 }} fill>
                                        <Layouts.Col gap={4} align={"center"} fit>
                                            <Elements.Text type={"h3"}>Invalid Request</Elements.Text>
                                            <Elements.Text weight={"bold"} opacity={0.6}>
                                                {"The given app information is something wrong. Couldn't found the information of requested app."}
                                            </Elements.Text>
                                        </Layouts.Col>
                                    </Layouts.Col>
                                </Layouts.Col>
                            </Layouts.Contents.InnerContent>
                            <Layouts.Col gap={4} align={"center"} style={{ padding: "4em", paddingTop: 0 }}>
                                <Layouts.Row gap={2}>
                                    <Controls.Button type={"glass"} onClick={handleClose}>
                                        Cancel
                                    </Controls.Button>
                                </Layouts.Row>
                            </Layouts.Col>
                        </Layouts.Col>
                    </Layouts.Contents.InnerContent>
                ))}
        </AnimatePresence>
    );
}
