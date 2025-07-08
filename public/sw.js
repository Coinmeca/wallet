// msg receive
self.addEventListener("message", (event) => {
    const { type, params } = event.data;

    if (!type || type === "") return;

    switch (type) {
        case "TRACK_TRANSACTION": {
            if (Array.isArray(params) && params.length > 1) {
                trackTransaction(params[0], params[1]);
            }
            break;
        }
    }
});

// track transaction
async function trackTransaction(txHash, rpcUrl) {
    if (!txHash || !txHash.startsWith("0x") || !rpcUrl) return;
    let confirmed = false;

    while (!confirmed) {
        try {
            const res = await fetch(rpcUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    method: "eth_getTransactionReceipt",
                    params: [txHash],
                    id: 1,
                }),
            });

            const json = await res.json();
            const receipt = json.result;

            if (receipt && receipt.status) {
                confirmed = true;
                const status = receipt.status === "0x1" ? "Success" : "Failed";

                self.registration.showNotification("Transaction Update", {
                    body: `Tx ${txHash.slice(0, 10)}... is ${status}`,
                    icon: "/icon.png",
                });
            }
        } catch (e) {
            console.error("Polling failed:", e);
        }

        await new Promise((resolve) => setTimeout(resolve, 5000)); // 5초 대기
    }
}

// web push receive
self.addEventListener("push", function (event) {
    if (event.data) {
        const data = event.data.json();
        const urlToOpen = data.url || "https://wallet.coinmeca.net/transactions";

        const options = {
            body: data.body,
            icon: data.icon || "/icon.png",
            badge: "/badge.png",
            vibrate: [100, 50, 100],
            data: {
                url: urlToOpen,
                dateOfArrival: Date.now(),
            },
        };

        event.waitUntil(self.registration.showNotification(data.title, options));
    }
});

// noti click
self.addEventListener("notificationclick", function (event) {
    event.notification.close();
    const url = event.notification.data && event.notification.data.url ? event.notification.data.url : "https://wallet.coinmeca.net/transactions";
    event.waitUntil(clients.openWindow(url));
});

// {
//   "title": "New Transaction Alert",
//   "body": "0x1234...abcd has been confirmed",
//   "icon": "/icon.png",
//   "url": "https://wallet.coinmeca.net/transactions/0x1234abcd"
// }
