"use client";
import { Controls, Layouts } from "@coinmeca/ui/components";
import { useTelegram } from "hooks";
import { useState } from "react";

export default function Home() {
    const { telegram, send, show, expand, exit, bio } = useTelegram();
    const [authenticate, setAuthenticate] = useState<string | null>(null);
    const [requestAccess, setRequestAccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

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

    const handleWindowPopup = () => {
        const width = 360;
        const height = 720;

        // Get the current window's dimensions and position
        const currentWindowWidth = window.innerWidth;
        const currentWindowHeight = window.innerHeight;
        const currentWindowLeft = window.screenX;
        const currentWindowTop = window.screenY;

        // Calculate center position based on the current window
        const left = currentWindowLeft + (currentWindowWidth - width) / 2;
        const top = currentWindowTop + (currentWindowHeight - height) / 2;

        window.open(
            "https://wallet.coinmeca.net",
            "_blank",
            `left=${left},top=${top},width=${width},height=${height},toolbar=no,location=no,menubar=no,status=no,resizable=no,scrollbars=no`,
        );
    };

    return (
        <Layouts.Col>
            <div>{telegram ? `Success, Platform: ${telegram.platform}` : "Fail"}</div>
            <Controls.Button onClick={handleSendData}>Send Data</Controls.Button>
            <Controls.Button onClick={handleExpand}>Expand</Controls.Button>
            <Controls.Button onClick={handleShowConfirm}>Show Confirm</Controls.Button>
            <Controls.Button onClick={handleShowPopup}>Show Popup</Controls.Button>
            <Controls.Button onClick={handleRequest}>Biometric Request</Controls.Button>
            <Controls.Button onClick={handleAuthenticate}>Biometric Auth</Controls.Button>
            <Controls.Button onClick={handleWindowPopup}>New Popup</Controls.Button>
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
