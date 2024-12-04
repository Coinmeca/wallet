"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { format } from "@coinmeca/ui/lib/utils";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { Account, App } from "@coinmeca/wallet-sdk/types";
import { valid } from "@coinmeca/wallet-sdk/utils";
import { AnimatePresence, motion } from "framer-motion";

import { useMessageHandler } from "hooks";
import { camelToTitleCase, short } from "utils";

const method = "eth_signTypedData";
const timeout = 5000;

export default function Page() {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { provider } = useCoinmecaWalletProvider();
    const { getRequest, getRequestById, success, failure, next, count, setCurrent } = useMessageHandler();

    const [load, setLoad] = useState(true);
    const [id, setId] = useState("");

    const [level, setLevel] = useState(0);
    const [error, setError] = useState<any>();

    const { app, auth, data, signer } = useMemo(() => {
        let data: any;
        let address: string;

        let auth: boolean | undefined;
        let app: App | undefined;
        let signer: Account | undefined;

        const request = getRequestById(id);
        if (request) {
            const { params, app: _app } = request;
            app = _app;

            const _0 = valid.address(params[0]);
            const _1 = valid.address(params[1]);

            if (_0 || _1) {
                _1 ? ((data = params[0]), (address = params[1])) : ((data = params[1]), (address = params[0]));
                data = typeof data === "string" && data?.startsWith('{"types":') ? JSON.parse(data) : data;
                auth = _app?.url ? provider?.allowance(_app?.url, address) : false;
                signer = provider?.account(address);

                if (data && data !== "") {
                    data = typeof data === "string" ? JSON.parse(data) : data;
                    const chainId = Number(data?.domain?.chainId);
                    if (!isNaN(chainId)) provider?.switchEthereumChain(chainId);
                }
            }
        }

        return {
            app,
            auth,
            data,
            signer,
        };
    }, [id]);

    const handleClose = () => {
        if (level < 2) failure(id, "User rejected the request");
        close();
    };

    const handleSign = async () => {
        setLevel(1);
        await provider
            ?.signTypedData(app?.url!, data, 4, signer?.address) // fixme: app.url?
            .then((result) => {
                success(id, result);
                setLevel(1);
                if (count <= 1) timeoutRef.current = setTimeout(handleClose, timeout);
            })
            .catch((error) => {
                console.log(error);
                failure(id, "Failed to signning");
                setError(error);
                setLevel(2);
            });
    };

    const DisplayTypedData = ({ typedData }: any) => {
        const renderValue = (value: any, type: any) => {
            // Parse value based on type
            if (type === "number") {
                return (
                    <Elements.Text align={"right"} fix>
                        {format(value, "number", {
                            unit: 9,
                            limit: 12,
                            fix: 9,
                        })}
                    </Elements.Text>
                );
            }
            if (type === "string") {
                return (
                    <Elements.Text align={"right"} fix>
                        {value?.startsWith("0x") && value?.length >= 20 ? short(value) : value}
                    </Elements.Text>
                );
            }
            if (type === "address") {
                return (
                    <Elements.Text align={"right"} fix>
                        {valid.address(value) ? short(value) : value}
                    </Elements.Text>
                );
            }
            if (type?.startsWith("int") || type?.startsWith("uint")) {
                return (
                    <Elements.Text align={"right"} fix>
                        {format(value, "number", {
                            unit: 9,
                            limit: 12,
                            fix: 9,
                        })}
                    </Elements.Text>
                );
            }
            return Object.entries(value).map(([key, value]) => (
                <Layouts.Row key={key} style={{ flexBasis: "100%" }}>
                    <Elements.Text opacity={0.6} fit>
                        {camelToTitleCase(key)}
                    </Elements.Text>
                    <Layouts.Row key={key}>
                        {Array.isArray(value) ? value.map((item) => renderType(item.name, item.value)) : renderValue(value, typeof value)}
                    </Layouts.Row>
                </Layouts.Row>
            ));
        };

        const renderType = (type: any, value: any) => {
            return (
                <div key={type}>
                    <strong>{type}</strong>: {renderValue(value, type)}
                </div>
            );
        };

        return (
            <Layouts.Col gap={1}>
                <Layouts.Box
                    style={{
                        "--white": "255,255,255",
                        "--black": "0, 0, 0",
                        background: "rgba(var(--black),.3)",
                        maxHeight: "max-content",
                        padding: "clamp(2em, 7.5%, 4em)",
                        width: "auto",
                        height: "auto",
                    }}
                    fit>
                    <Layouts.Col gap={2}>
                        <Elements.Text type={"desc"}>Domain</Elements.Text>
                        <Layouts.Col gap={2}>
                            {Object.entries(typedData.domain).map(([key, value]) =>
                                Array.isArray(value) || typeof value === "object" ? (
                                    <Layouts.Col key={key} gap={1}>
                                        <Elements.Text opacity={0.6} case={"capital"} fit>
                                            {camelToTitleCase(key)}
                                        </Elements.Text>
                                        <Layouts.Row
                                            gap={1}
                                            align={"right"}
                                            style={!Array.isArray(value) && typeof value !== "object" ? { minWidth: "max-content" } : {}}
                                            fix={!Array.isArray(value) && typeof value !== "object"}>
                                            {Array.isArray(value) ? value.map((item) => renderType(item.name, item.value)) : renderValue(value, typeof value)}
                                        </Layouts.Row>
                                    </Layouts.Col>
                                ) : (
                                    <Layouts.Row key={key} gap={1}>
                                        <Elements.Text opacity={0.6} case={"capital"} fit>
                                            {camelToTitleCase(key)}
                                        </Elements.Text>
                                        <Layouts.Row
                                            gap={1}
                                            align={"right"}
                                            style={!Array.isArray(value) && typeof value !== "object" ? { minWidth: "max-content" } : {}}
                                            fix={!Array.isArray(value) && typeof value !== "object"}>
                                            {Array.isArray(value) ? value.map((item) => renderType(item.name, item.value)) : renderValue(value, typeof value)}
                                        </Layouts.Row>
                                    </Layouts.Row>
                                ),
                            )}
                        </Layouts.Col>
                    </Layouts.Col>
                </Layouts.Box>
                <Layouts.Box
                    style={{
                        "--white": "255,255,255",
                        "--black": "0, 0, 0",
                        background: "rgba(var(--black),.3)",
                        maxHeight: "max-content",
                        padding: "clamp(2em, 7.5%, 4em)",
                        width: "auto",
                        height: "auto",
                    }}
                    fit>
                    <Layouts.Col gap={2}>
                        <Elements.Text type={"desc"}>Message</Elements.Text>
                        {Object.entries(typedData.message).map(([key, value]) =>
                            key === "contents" || Array.isArray(value) || typeof value === "object" ? (
                                <Layouts.Col key={key} gap={2}>
                                    <Elements.Text type={key === "contents" ? "desc" : undefined} opacity={1} fit>
                                        {camelToTitleCase(key)}
                                    </Elements.Text>
                                    <Layouts.Row
                                        gap={1}
                                        align={key === "contents" ? "left" : "right"}
                                        style={!Array.isArray(value) && typeof value !== "object" ? { minWidth: "max-content" } : {}}
                                        fix={!Array.isArray(value) && typeof value !== "object"}>
                                        {Array.isArray(value) ? value.map((item) => renderType(item.name, item.value)) : renderValue(value, typeof value)}
                                    </Layouts.Row>
                                </Layouts.Col>
                            ) : (
                                <Layouts.Row key={key} gap={2}>
                                    <Elements.Text opacity={0.6} fit>
                                        {camelToTitleCase(key)}
                                    </Elements.Text>
                                    <Layouts.Row
                                        gap={1}
                                        align={"right"}
                                        style={{ minWidth: "max-content" }}
                                        fix={!Array.isArray(value) && typeof value !== "object"}>
                                        {Array.isArray(value) ? value.map((item) => renderType(item.name, item.value)) : renderValue(value, typeof value)}
                                    </Layouts.Row>
                                </Layouts.Row>
                            ),
                        )}
                    </Layouts.Col>
                </Layouts.Box>
            </Layouts.Col>
        );
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
        const id = getRequest(method)?.id;
        setId(id);
    }, []);

    return (
        <AnimatePresence>
            {load &&
                (typeof data === "object" && auth && signer ? (
                    <Layouts.Contents.SlideContainer
                        contents={[
                            {
                                active: true,
                                children: (
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
                                                                style: { overflow: "initial" },
                                                                children: (
                                                                    <Layouts.Col gap={8} style={{ flex: 1, height: "100%" }} fill>
                                                                        <Layouts.Col style={level === 0 ? { minHeight: "max-content" } : {}} reverse fill>
                                                                            <DisplayTypedData typedData={data} />
                                                                        </Layouts.Col>
                                                                    </Layouts.Col>
                                                                ),
                                                            },
                                                            {
                                                                active: level === 1,
                                                                children: (
                                                                    <Layouts.Col gap={0} align={"center"} style={{ height: "100%" }} fill>
                                                                        <Layouts.Col gap={4} align={"center"} fit>
                                                                            <Elements.Text type={"h3"}>Complete</Elements.Text>
                                                                            <Elements.Text size={1} weight={"bold"}>
                                                                                <Elements.Text opacity={0.6}>Signed in requested message with</Elements.Text>{" "}
                                                                                <Elements.Text>{`${signer?.name}(${short(signer?.address)})`}</Elements.Text>{" "}
                                                                                <Elements.Text opacity={0.6}>in</Elements.Text>{" "}
                                                                                <Elements.Text>{` ${app?.url}`}</Elements.Text>
                                                                                <Elements.Text opacity={0.6}>.</Elements.Text>
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
                                                                    <Controls.Button type={"line"} onClick={handleSign}>
                                                                        Sign
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
                                        Close
                                    </Controls.Button>
                                </Layouts.Row>
                            </Layouts.Col>
                        </Layouts.Col>
                    </Layouts.Contents.InnerContent>
                ))}
        </AnimatePresence>
    );
}
