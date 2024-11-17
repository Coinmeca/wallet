"use client";

import { Controls, Layouts } from "@coinmeca/ui/components";
import { useCoinmecaWallet } from "@coinmeca/wallet-provider/adapter";
import { getChainsByType } from "@coinmeca/wallet-provider/chains";
import { useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { useTelegram } from "hooks";
import { useState } from "react";

export default function Page({ children }: { children?: any }) {

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
                        value: 0n,
                        gasLimit: 21000n,
                        maxPriorityFeePerGas: 2_000_000n,
                        maxFeePerGas: 3_000_000n,
                        type: 2
                    },
                ],
            }),
        );
    };

    const handleApprove = async () => {
        console.log(
            await adapter?.request({
                method: 'eth_sendTransaction',
                params: [
                    {
                        "from": account?.address,
                        "to": "0xYourTokenContractAddress",
                        "data": "0x095ea7b30000000000000000000000000x1234567890123456789012345678901234567890000000000000000000000000000000001b69b4e3eb3e4c0b1b7f89d8f"
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
            <Controls.Button onClick={handleRequestAccounts}>Request Accounts</Controls.Button>
            <Controls.Button onClick={handleSendTransaction}>Send Transaction</Controls.Button>
            <Controls.Button onClick={handleApprove}>ERC20 Approve</Controls.Button>
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
