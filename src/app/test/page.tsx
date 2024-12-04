"use client";

import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { useCoinmecaWallet } from "@coinmeca/wallet-provider/adapter";
import { getChainsByType } from "@coinmeca/wallet-provider/chains";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { useTelegram } from "hooks";
import { useLayoutEffect, useState } from "react";

export default function Page() {
    const { telegram, send, show, expand, exit, bio } = useTelegram();

    const [metamask, setMetamask] = useState<any>();
    const [coinbase, setCoinbase] = useState<any>();
    const [coinmeca, setCoinmeca] = useState<any>();

    useLayoutEffect(() => {
        window.addEventListener("eip6963:announceProvider", (event: any) => {
            if (event?.detail?.info?.name === "MetaMask") setMetamask(event?.detail?.provider);
            if (event?.detail?.info?.name === "Coinbase Wallet") setCoinbase(event?.detail?.provider);
            if (event?.detail?.info?.name === "Coinmeca Wallet") setCoinmeca(event?.detail?.provider);
        });
        window.dispatchEvent(new Event("eip6963:requestProvider"));
    }, []);

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
                        logo: "https://web3.coinmeca.net/421614/logo.svg",
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
        // approve
        const method = "eth_sendTransaction";
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
            }),
        );
    };

    const handleSign = async () => {
        const method = "eth_sign";
        console.log(
            method,
            await adapter?.request({
                method,
                params: [
                    // Message to sign
                    "Hello, Ethereum!",
                    // Signer's address
                    "0x94b1f182d48dd9d84e1ab0ee3a593364595bb4ec",
                ],
            }),
        );
        // result
        //0x{r}{s}{v}
    };

    const handlePersonalSign = async () => {
        const method = "personal_sign";
        const params = [
            // Message to sign
            "Hello, Personal Sign!",
            // Signer's address
            account?.address,
        ];

        // result
        // signature
        console.log(
            // await metamask?.request({
            //     method,
            //     params,
            // }),
            // await coinbase?.request({
            //     method,
            //     params,
            // }),
            await coinmeca?.request({
                method,
                params,
            }),
        );
    };

    const handleSignTypedDataV4 = async () => {
        const method = "eth_signTypedData_v4";
        const params = [
            // "0x6a9E5CAc3E72EEE92A2F7e97d70041BB94902Ad8",
            {
                types: {
                    EIP712Domain: [
                        { name: "name", type: "string" },
                        { name: "version", type: "string" },
                        { name: "chainId", type: "uint256" },
                        { name: "verifyingContract", type: "address" },
                    ],
                    Person: [
                        { name: "name", type: "string" },
                        { name: "wallet", type: "address" },
                    ],
                    Mail: [
                        { name: "from", type: "Person" },
                        { name: "to", type: "Person" },
                        { name: "contents", type: "string" },
                    ],
                },
                primaryType: "Mail",
                domain: {
                    name: "Ether Mail",
                    version: "1",
                    chainId: 421614,
                    verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
                },
                message: {
                    from: {
                        name: "Cow",
                        wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
                    },
                    to: {
                        name: "Bob",
                        wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
                    },
                    contents: "Hello, Bob!",
                },
            },
        ];

        // result
        // 0x r s v
        console.log(
            // await metamask?.request({
            //     method,
            //     params,
            // }),
            // await coinbase?.request({
            //     method,
            //     params,
            // }),
            await coinmeca?.request({
                method,
                params,
            }),
        );
    };

    const handleSignTransaction = async () => {
        const method = "eth_signTransaction";
        const params = [
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
        ];

        // result
        // 0x r s v
        console.log(
            // await metamask?.request({
            //     method,
            //     params,
            // }),
            // await coinbase?.request({
            //     method,
            //     params,
            // }),
            await coinmeca?.request({
                method,
                params,
            }),
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
            }),
        );
    };

    const handleWatchAsset = async () => {
        const method = "wallet_watchAsset";
        console.log(
            method,
            await adapter?.request({
                method,
                params: {
                    type: "ERC20",
                    options: {
                        address: "0xB0dC252702809dB49eda2B0F2F58A1708ca3E0D1",
                        symbol: "FOO",
                        decimals: 18,
                        image: "https://foo.io/token-image.svg",
                    },
                },
            }),
        );
    };

    return (
        <Layouts.Col>
            <Layouts.Box>
                <Elements.Text>{telegram ? `Success, Platform: ${telegram.platform}` : "Fail"}</Elements.Text>
            </Layouts.Box>
            <Controls.Button onClick={handleAddEthereumChain}>Add Ethereum Chain</Controls.Button>
            <Controls.Button onClick={switchEthereumChain}>Switch Ethereum Chain</Controls.Button>
            <Controls.Button onClick={handleEthAccounts}>Eth Accounts</Controls.Button>
            <Controls.Button onClick={handleRequestAccounts}>Request Accounts</Controls.Button>
            <Controls.Button onClick={handleSign}>Sign</Controls.Button>
            <Controls.Button onClick={handlePersonalSign}>Personal Sign</Controls.Button>
            <Controls.Button onClick={handleSignTypedDataV4}>Sign TypedDataV4</Controls.Button>
            <Controls.Button onClick={handleSignTransaction}>Sign Transaction</Controls.Button>
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
            <Layouts.Box>
                <Elements.Text>{authenticate && `Authenticate: ${authenticate}`}</Elements.Text>
                <Elements.Text>{requestAccess && `Request Access: ${requestAccess}`}</Elements.Text>
                <Elements.Text>{error && `Error: ${error}`}</Elements.Text>
            </Layouts.Box>
        </Layouts.Col>
    );
}
