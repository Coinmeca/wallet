import React, { createContext, useContext, useEffect, useState } from "react";

type NotificationContextType = {
    isSubscribed: boolean;
    push: (type: string, params: any) => void;
};

const OSNotificationContext = createContext<NotificationContextType | null>(null);

export const useOSNotification = () => {
    const context = useContext(OSNotificationContext);
    if (!context) {
        throw new Error("useNotification must be used within a NotificationProvider");
    }
    return context;
};

export const OSNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        if (!("serviceWorker" in navigator)) {
            console.warn("Service workers not supported.");
            return;
        }

        const registerAndSubscribe = async () => {
            try {
                const registration = await navigator.serviceWorker.register("/service-worker.js");
                console.log("Service Worker registered:", registration.scope);

                if (Notification.permission === "granted") {
                    await subscribeToPush(registration);
                } else {
                    const permission = await Notification.requestPermission();
                    if (permission === "granted") {
                        await subscribeToPush(registration);
                    }
                }
            } catch (error) {
                console.error("Service Worker registration failed:", error);
            }
        };

        registerAndSubscribe();
    }, []);

    const subscribeToPush = async (registration: ServiceWorkerRegistration) => {
        const key = "<Your_VAPID_Public_Key>";
        const applicationServerKey = urlBase64ToUint8Array(key);

        try {
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey,
            });
            console.log("Push subscription:", subscription);
            setIsSubscribed(true);
            // Send subscription to server here if needed
        } catch (error) {
            console.error("Push subscription failed:", error);
        }
    };

    const push = (type: string, params: any) => {
        // Send the transaction hash to the service worker for tracking
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type,
                params,
            });
        }
    };

    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
        const rawData = window.atob(base64);
        return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
    };

    return <OSNotificationContext.Provider value={{ isSubscribed, push }}>{children}</OSNotificationContext.Provider>;
};
