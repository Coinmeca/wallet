// public/service-worker.js

self.addEventListener("message", (event) => {
    const { type, params } = event.data;

    if (!type || type !== "") return;

    switch (type) {
        case "TRACK_TRANSACTION": {
            trackTransaction(params?.[0], params?.[1]);
            break;
        }
    }
});

async function trackTransaction(txHash, rpcUrl) {
    if (!txHash || txHash === "" || !txHash.startsWith("0x") || !rpcUrl || !rpcUrl === "") return;
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

        await new Promise((resolve) => setTimeout(resolve, 1000)); // Poll every 5 seconds
    }
}
