"use client";

import { useEffect, useRef, useState } from "react";
import { Controls, Layouts } from "@coinmeca/ui/components";
import { useCoinmecaWallet, useCoinmecaWalletProvider } from "@coinmeca/wallet-sdk/contexts";
import { getChainsByType } from "@coinmeca/wallet-sdk/chains";
import { useTelegram } from "hooks";

export default function Home() {
    const { telegram, send, show, expand, exit, bio } = useTelegram();
    const [authenticate, setAuthenticate] = useState<string | null>(null);
    const [requestAccess, setRequestAccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { account, chain } = useCoinmecaWalletProvider();
    const { adapter } = useCoinmecaWallet();
    const [tab, setTab] = useState("test");

    const handleExpand = () => {
        expand();
    };

    const handleSendData = () => {
        send("webapp message");
    };

    const handleClose = () => {
        exit();
    };

    const handleShowConfirm = () => {
        show.confirm("showConfirm");
    };

    const handleShowPopup = () => {
        show.popup({
            title: "showPopup",
            message: "do something",
            buttons: [{ type: "close", text: "Close" }],
        });
    };

    const handleRequest = () => {
        if (telegram?.BiometricManager) {
            try {
                // Request access with required params
                const accessResponse = bio.request("sign");
                setRequestAccess(JSON.stringify(accessResponse));
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            }
        } else {
            setError("BiometricManager is not available.");
        }
    };

    const handleAuthenticate = () => {
        if (telegram?.BiometricManager) {
            try {
                // Authenticate user with required params
                const authResponse = bio.auth("sign");
                setAuthenticate(JSON.stringify(authResponse));
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            }
        } else {
            setError("BiometricManager is not available.");
        }
    };

    const handleAddEthereumChain = async () => {
        const chains = getChainsByType("mainnet").filter((c) => c?.chainId !== chain?.chainId);
        console.log(await adapter?.request({ method: "wallet_addEthereumChain", params: [chains[Math.floor(Math.random() * chains.length)]] }));
    };

    const switchEthereumChain = async () => {
        const chains = getChainsByType("mainnet").filter((c) => c?.chainId !== chain?.chainId);
        console.log(
            await adapter?.request({ method: "wallet_switchEthereumChain", params: [{ chainId: chains[Math.floor(Math.random() * chains.length)]?.chainId }] }),
        );
    };

    const handleRequestAccounts = async () => {
        console.log(await adapter?.request({ method: "eth_requestAccounts" }));
    };

    const handleSendTransaction = async () => {
        console.log(
            await adapter?.request({
                method: "eth_sendTransaction",
                params: [
                    {
                        from: account?.address,
                        to: "0x0000000000000000000000000000000000000000",
                        value: "0x0",
                        gasLimit: "0x5028",
                        maxFeePerGas: "0x2540be400",
                        maxPriorityFeePerGas: "0x3b9aca00",
                    },
                ],
            }),
        );
    };

    const iframeRef = useRef<HTMLIFrameElement | null>(null);

    useEffect(() => {
        // const iframe = iframeRef.current;
        // if (iframe) {
        //     // Ensure iframe is loaded before accessing its content
        //     const onIframeLoad = () => {
        //         const iframeWindow = iframe?.contentWindow;
        //         if (iframeWindow) {
        //             const announceEvent = new CustomEvent("eip6963:announceProvider", {
        //                 detail: {
        //                     info: {
        //                         name: "Coinmeca Wallet",
        //                         icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAFT0lEQVR4AbVWBWxbVxQ975ND3+GkzBBORmVmZqYxB8bMvBXGaQdWmSHpmJkXLDMF1YBaq3O5Z35WubYbPNKR7E/vwrmAqsLeeF3okeavTSlvOsJW3CYxa39is7I9XcJP7xkaePrAjIDyg0/5Z9kXB3x0/F//ydxuhqGuUG5ujyryX23bYNxxaL3SnrMQwBRonCwUjhSCoxTBqarg/T6C74ULftdDcM+L6mH7j8b8438Y8agp/sJf1h2WrTN/UtMdr6E7RyKE7aAzCIIWgKqTylnK3/JaiADjFHCaLzg/HtzxmuJw5Bozy7bBRHWQZZRH/aRtynsdz7IfYhgBX2oQBFAl6k42U8DpAeDnw8GKb5S849uNKFQF/+j/3bBc2VoyAw+zJVpQh0oANaJFgDcY4PsJYPEqpfREiX4DvGGN0/M56o7S/niUoWhM4cXrqlJxsq0GzmwHFq9WSugpErawMvNxy4G8G/AKrWhKnD28LijOGpGeAFZ8q+RW/AUrLkdySNnMeLGcJuKueriqqgwMDGTjxo0l5W957aqRkOn4fAToyDdm4mKMb1UQn+SX4wgQYyhgePyIj48PR4wYwYyMDBYWFvLo0aMuFhQUcN26dRw2bBgtFotXTUw3wZ1vKI7j5Rel4trWRfMD1HepioYeX27atCkzMzN56tQpesLJkyddxjVs6OU7Kjg/ATzyu2GDxHWT7WFhTTYe1sQ4AprHw7Ozs1kVnDlzhqmpqV5LdJofuO9V7RALzVBETq6crJuZFKK9+7BZLNJztwdJjyXl73PX5s2bRz8/P696iFPB73oJHs+1ToE5rugjYbxOIMjtw8OHD3cdcjH27dvHlJQUxsbGMi4ujsnJydy9ezfT09OvejjOdsx3IwXtS/xt8Bm9K0to9xAw3Kpdiuti7N27lzExMRTiQqXI3yEhITQMo2oNysn7fQUPPu2fBWPs5nKhjifcdDxZXlLhF4f93nvvrXVfUJ2cqgkW3GyWQZ+afxraMHe1L2tcltnFKpdhr5PuKKfo3uFBzrPv8GxAo0aN6s0AOcr3dAt3nv3IpjJYJhJQ3KZANpyLUyDFJ4SodQomC5X7k5qXQ5uzLQsByVUWoawAKUIAl4gwNDS0yiI0nEyBweK2iVnQ1++1oclMQgl2+7BsvbL7XW6ELL1zZZiWluYqw7lz51apDOVSM0uYrGw++kMYWwumYEAGoUV76v+yvdZpI2oHg+uVKDpavDEZsNtDldezDyFgktdWnJOTw6rgrE48Hq5BcCRCudFy12G2+zEMEvofu21ITCe0xlcdRtJjT5CpkprxNowi4MfX0YNF/hnzcQ5G+d4o8dpfDlgnEcL7OJatWaZENqjLx7G8520ca1DZH7H8WZ3nOBJcEI+LoW3eMxNDVhCWa+tlIREQbIUWfAPPc49l10xcgYqdVuXrTXmIn03orep0JQOEa8e8EY/wN217XhnKTLiDYS+OUlbklaDti3VohKAVzTgAj3OlsqN0u3E8Ct6glx+4QVmRW+qKhM+1bjRRdQoYtCKeHfEq31J3leTqJ25AVSBFqXyzOQ9DVxCBk89Wh1aNwzXXemeKsUxQVvAp36Lcr03peXVQts2UwnRVR1I6YU4i9GhCCTobFcVJcZbyt0GIINdmpTkPNtX3mOSf50gNqZy5JKTCiprCqCyI13/fNV+ZmX1YDMwgms0irMmEz0TCGEahS4538h4qljdoWDMZ3nTToWvbHrTd1M4ehbqCaS8OM7YWTdY/3feh/ta2LOcULdfvzD+tT99w2jJhS5nvmN1ZzvXO1mhq5ZQOM+yhqCL+B+AWe5nrKa3ZAAAAAElFTkSuQmCC",
        //                         uuid: crypto.randomUUID(),
        //                         rdns: "net.coinmeca.wallet",
        //                     },
        //                     provider: adapter,
        //                 },
        //             });
        //             iframeWindow.dispatchEvent(announceEvent);
        //             iframeWindow.addEventListener("eip6963:requestProvider", () => {
        //                 iframeWindow.dispatchEvent(announceEvent);
        //             });
        //         }
        //     };
        //     // Add event listener to iframe load event
        //     iframe.addEventListener("load", onIframeLoad);
        //     // Clean up the event listener when component unmounts
        //     return () => {
        //         iframe.removeEventListener("load", onIframeLoad);
        //     };
        // }
    }, []);

    return (
        <Layouts.Contents.InnerContent>
            <Layouts.Menu
                menu={[
                    [
                        <>
                            <Controls.Tab onClick={() => setTab("test")}>Test</Controls.Tab>
                        </>,
                        <>
                            <Controls.Tab onClick={() => setTab("dapp")}>dApp</Controls.Tab>
                        </>,
                    ],
                ]}
            />
            <Layouts.Contents.TabContainer
                contents={[
                    {
                        active: tab === "test",
                        children: (
                            <Layouts.Col>
                                <div>{telegram ? `Success, Platform: ${telegram.platform}` : "Fail"}</div>
                                <Controls.Button onClick={handleAddEthereumChain}>Add Ethereum Chain</Controls.Button>
                                <Controls.Button onClick={switchEthereumChain}>Switch Ethereum Chain</Controls.Button>
                                <Controls.Button onClick={handleRequestAccounts}>Request Accounts</Controls.Button>
                                <Controls.Button onClick={handleSendTransaction}>Send Transaction</Controls.Button>
                                <Controls.Button onClick={handleSendData}>Send Data</Controls.Button>
                                <Controls.Button onClick={handleExpand}>Expand</Controls.Button>
                                <Controls.Button onClick={handleShowConfirm}>Show Confirm</Controls.Button>
                                <Controls.Button onClick={handleShowPopup}>Show Popup</Controls.Button>
                                <Controls.Button onClick={handleRequest}>Biometric Request</Controls.Button>
                                <Controls.Button onClick={handleAuthenticate}>Biometric Auth</Controls.Button>
                                <Controls.Button onClick={handleClose}>Close</Controls.Button>
                                {authenticate && `Authenticate: ${authenticate}`}
                                <br />
                                {requestAccess && `Request Access: ${requestAccess}`}
                                <br />
                                {error && `Error: ${error}`}
                                <br />
                            </Layouts.Col>
                        ),
                    },
                    {
                        active: tab === "dapp",
                        children: <iframe ref={iframeRef} src="https://metamask.github.io/test-dapp/" width="100%" height="100%" allowFullScreen></iframe>,
                    },
                ]}
            />
        </Layouts.Contents.InnerContent>
    );
}
