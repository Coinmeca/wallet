"use client";

import { Controls, Layouts } from "@coinmeca/ui/components";
import { useCoinmecaWallet } from "@coinmeca/wallet-provider/adapter";
import { getChainsByType } from "@coinmeca/wallet-provider/chains";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { useTelegram } from "hooks";
import { useState } from "react";

export default function Page() {
    const { telegram, send, show, expand, exit, bio } = useTelegram();
    const [authenticate, setAuthenticate] = useState<string | null>(null);
    const [requestAccess, setRequestAccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { account, chain } = useCoinmecaWalletProvider();
    const { adapter } = useCoinmecaWallet();

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
        // console.log(await adapter?.request({ method: "wallet_addEthereumChain", params: [chains[Math.floor(Math.random() * chains.length)]] }));
        console.log(
            await adapter?.request({
                method: "wallet_addEthereumChain",
                params: [
                    {
                        chainId: 421614,
                        base: "evm",
                        chainName: "Arbitrum Sepolia",
                        logo: "https://coinmeca-web3.vercel.app/421614/logo.svg",
                        rpcUrls: [
                            "https://sepolia-rollup.arbitrum.io/rpc",
                            "https://arbitrum-sepolia.blockpi.network/v1/rpc/public",
                            "https://endpoints.omniatech.io/v1/arbitrum/sepolia/public",
                        ],
                        blockExplorerUrls: ["https://sepolia.arbiscan.io/"],
                        nativeCurrency: {
                            name: "Ethereum",
                            symbol: "ETH",
                            decimals: 18,
                        },
                    },
                ],
            }),
        );
    };

    const switchEthereumChain = async () => {
        const chains = getChainsByType("mainnet").filter((c) => c?.chainId !== chain?.chainId);
        console.log(
            await adapter?.request({ method: "wallet_switchEthereumChain", params: [{ chainId: chains[Math.floor(Math.random() * chains.length)]?.chainId }] }),
        );
    };

    const handleEthAccounts = async () => {
        const method = "eth_accounts";
        console.log(method, await adapter?.request({ method }));
    };

    const handleRequestAccounts = async () => {
        const method = "eth_requestAccounts";
        console.log(method, await adapter?.request({ method }));
    };

    const handleApprove = async () => {
        const method = "erc20_approve";
        console.log(
            method,
            await adapter?.request({
                method,
                params: [
                    {
                        from: account?.address,
                        to: "0x709C5856d329748344789C787a429B3cC7631894",
                        data: "0x095ea7b3000000000000000000000000428d55b528a2d39c143ec51055e7e0531d02aa81ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
                    },
                ],
            })
        );
    };

    const handleSendTransaction = async () => {
        const method = "eth_sendTransaction";
        console.log(
            method,
            await adapter?.request({
                method,
                params: [
                    // test
                    // {
                    //     from: account?.address,
                    //     to: "0x0000000000000000000000000000000000000000",
                    //     value: 0n,
                    //     gasLimit: 21000n,
                    //     maxPriorityFeePerGas: 2_000_000n,
                    //     maxFeePerGas: 3_000_000n,
                    //     type: 2,
                    // },
                    // faucet
                    // {
                    //     from: account?.address,
                    //     to: "0x709C5856d329748344789C787a429B3cC7631894",
                    //     data: "0x7b56c2b200000000000000000000000094b1f182d48dd9d84e1ab0ee3a593364595bb4ec00000000000000000000000000000000000000000000000000000002540be400",
                    // },
                    // order
                    {                     
                        from: account?.address,
                        to: "0x284079c19f888f12f9d56955e466f2736a7f1994",
                        data: "0x05b102e3000000000000000000000000d42b5e48d0e2c265a87adf7e08d2fcd9c62ff17b0000000000000000000000000000000000000000000000000de0b6b3a7640000",
                    },
                ],
            })
        );
    };

    const handleWatchAsset = async () => {
        const method = "wallet_watchAsset";
        console.log(
            method,
            await adapter?.request({
                method,
                params: [
                    {
                        type: "ERC20",
                        options: {
                            address: "0xb60e8dd61c5d32be8058bb8eb970870f07233155",
                            symbol: "FOO",
                            decimals: 18,
                            image: "https://foo.io/token-image.svg",
                        },
                    },
                ],
            }),
        );
    };

    return (
        <Layouts.Col>
            <div>{telegram ? `Success, Platform: ${telegram.platform}` : "Fail"}</div>
            <Controls.Button onClick={handleAddEthereumChain}>Add Ethereum Chain</Controls.Button>
            <Controls.Button onClick={switchEthereumChain}>Switch Ethereum Chain</Controls.Button>
            <Controls.Button onClick={handleEthAccounts}>Eth Accounts</Controls.Button>
            <Controls.Button onClick={handleRequestAccounts}>Request Accounts</Controls.Button>
            <Controls.Button onClick={handleSendTransaction}>Send Transaction</Controls.Button>
            <Controls.Button onClick={handleApprove}>ERC20 Approve</Controls.Button>
            <Controls.Button onClick={handleWatchAsset}>ERC20 Watch Asset</Controls.Button>
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
    );
}
