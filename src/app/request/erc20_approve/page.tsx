import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { Account, TransactionParams } from "@coinmeca/wallet-sdk/types";
import { useMessageHandler, useTelegram } from "hooks";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";

/*
await window.ethereum.providerMap.get("CoinmecaWallet").request({
    method: 'eth_sendTransaction',
    params: [
        {
            "from": "0xc8b95755888a2be3f8fa19251f241a1e8b74f933`,
            "to": "0xYourTokenContractAddress",
            "data": "0x095ea7b30000000000000000000000000x1234567890123456789012345678901234567890000000000000000000000000000000001b69b4e3eb3e4c0b1b7f89d8f"
        },
    ],
})
*/

const method = "erc20_approve";
const timeout = 1000;

export default function Page() {
    const router = useRouter();

    const { telegram } = useTelegram();
    const { provider, account, chain } = useCoinmecaWalletProvider();
    const { params, app, isPopup } = useMessageHandler();

    const [tx, setTx] = useState<TransactionParams>();
    const [txHash, setTxHash] = useState<string>("");

    const [token, setToken] = useState<string>();

    const [signer, setSigner] = useState<Account>();
    const [spender, setSpender] = useState<string>("");
    const [amount, setAmount] = useState<number>(0);

    const [level, setLevel] = useState(0);
    const [error, setError] = useState<any>();


    
    useLayoutEffect(() => {
        if (params) {
            const { to, data } = params;
            if (data) {
                setSpender("0x" + data.slice(10, 74));
                setAmount(parseInt(data.slice(74, 138), 16));
            }
            setTx(tx);
            setSigner(provider?.account(tx?.from));
        }
    }, []);

    const handleClose = () => {
        if (isPopup) {
            if (telegram) telegram?.close();
            window?.close();
        } else router.push("/");
    };

    const handleApprove = async () => {
        setLevel(1);
        await provider
            ?.sign({ ...params, chainId: chain?.chainId }, signer!)
            .then((result) => {
                window?.opener?.postMessage(
                    {
                        method,
                        result,
                    },
                    "*",
                );
                setLevel(2);
                setTimeout(handleClose, timeout);
            })
            .catch((error) => {
                console.log(error);
                window?.opener?.postMessage(
                    {
                        method,
                        error: "Failed to signning",
                    },
                    "*",
                );
                setError(error);
                setLevel(3);
            });
    };

    return app ? (
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
                                                        alt={app.name || "Unknown"}
                                                        style={{ width: "8em", height: "8em" }}
                                                    />
                                                </div>
                                                <Layouts.Col gap={1}>
                                                    <Elements.Text type={"h6"}>{app.name || ""}</Elements.Text>
                                                    <Elements.Text type={"strong"} opacity={0.6}>
                                                        {app.url}
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
                                                                    <Elements.Text opacity={0.6}>
                                                                        (
                                                                        {account?.address?.substring(0, account?.address?.startsWith("0x") ? 8 : 6) +
                                                                            "..." +
                                                                            account?.address?.substring(account?.address?.length - 6, account?.address?.length)}
                                                                        ) to
                                                                    </Elements.Text>{" "}
                                                                    <Elements.Text>{app?.name}</Elements.Text>{" "}
                                                                    <Elements.Text opacity={0.6}>
                                                                        ({app?.url}). Please check out the information of app and allow connections only to apps
                                                                        you trust.
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
                                                                    <Elements.Text opacity={0.6}>Comepete to connect</Elements.Text>{" "}
                                                                    <Elements.Text>{account?.name}</Elements.Text>{" "}
                                                                    <Elements.Text opacity={0.6}>
                                                                        (
                                                                        {account?.address?.substring(0, account?.address?.startsWith("0x") ? 8 : 6) +
                                                                            "..." +
                                                                            account?.address?.substring(account?.address?.length - 6, account?.address?.length)}
                                                                        ) to
                                                                    </Elements.Text>{" "}
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
                                                        <Controls.Button type={"line"} onClick={handleApprove}>
                                                            Approve
                                                        </Controls.Button>
                                                    </Layouts.Row>
                                                ),
                                            },
                                            {
                                                active: level > 0,
                                                children: (
                                                    <Layouts.Row gap={2}>
                                                        <Controls.Button type={"glass"} onClick={handleClose}>
                                                            Close
                                                        </Controls.Button>
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
    );
}
