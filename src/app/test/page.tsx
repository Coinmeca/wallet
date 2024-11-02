"use client";
import { Controls, Layouts } from "@coinmeca/ui/components";
import { getChainById } from "chains";
import { useTelegram, useWallet } from "hooks";
import { useState } from "react";

export default function Home() {
    const { telegram, send, show, expand, exit, bio } = useTelegram();
    const [authenticate, setAuthenticate] = useState<string | null>(null);
    const [requestAccess, setRequestAccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { provider } = useWallet();

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
        await provider?.request({ method: "wallet_addEthereumChain", params: [getChainById(17000)] })
    }

    const handleRequestAccounts = async () => {
        await provider?.request({ method: "eth_requestAccounts" })
    }

    return (
        <Layouts.Col>
            <div>{telegram ? `Success, Platform: ${telegram.platform}` : "Fail"}</div>
            <Controls.Button onClick={handleAddEthereumChain}>Add Ethereum Chain</Controls.Button>
            <Controls.Button onClick={handleRequestAccounts}>Request Accounts</Controls.Button>
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
