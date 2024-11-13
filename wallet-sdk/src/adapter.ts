import { CoinmecaWalletBase } from "./core";
import { getFaviconUri, loadStorage, openWindow } from "./utils";
import axios from "axios";
import { getChainById } from "./chains";

// Create a custom Axios instance
const axiosQuiet = axios.create({
    timeout: 5000,
});

// Suppress logging of errors
axiosQuiet.interceptors.response.use(
    (response) => response,
    (error) => {
        // Return a resolved promise for errors to avoid logging
        return Promise.resolve({ error });
    },
);

const __confirm = (method: string) => {
    if (window.location.hostname?.includes("wallet.coinmeca.net")) {
        // window.history.pushState({ method }, "", `/request/${method}`);
        // (window as any).coinmeca = { ...(window as any)?.coinmeca, request: { method } };
        window.location.href = `/request/${method}`;
        return window;
    } else return openWindow(`${window.location.origin}/request/${method}`);
};

export class CoinmecaWalletAdapter extends CoinmecaWalletBase {
    get isCoinmecaWallet() {
        return true;
    }

    constructor() {
        super();

        window.ethereum = { ...window.ethereum, ...this };
        window.ethereum.providers = window.ethereum.providers || [];
        if (!window.ethereum.providers.find((p: any) => p?.isCoinmecaWallet)) window.ethereum.providers.push(this);

        if (!window.ethereum.providerMap) window.ethereum.providerMap = new Map<string, any>(); // Ensure providerMap is initialized
        window.ethereum.providerMap.set("CoinmecaWallet", this);

        new CustomEvent("eip6963:announceProvider", {
            detail: {
                info: {
                    name: "Coinmeca Wallet",
                    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAFT0lEQVR4AbVWBWxbVxQ975ND3+GkzBBORmVmZqYxB8bMvBXGaQdWmSHpmJkXLDMF1YBaq3O5Z35WubYbPNKR7E/vwrmAqsLeeF3okeavTSlvOsJW3CYxa39is7I9XcJP7xkaePrAjIDyg0/5Z9kXB3x0/F//ydxuhqGuUG5ujyryX23bYNxxaL3SnrMQwBRonCwUjhSCoxTBqarg/T6C74ULftdDcM+L6mH7j8b8438Y8agp/sJf1h2WrTN/UtMdr6E7RyKE7aAzCIIWgKqTylnK3/JaiADjFHCaLzg/HtzxmuJw5Bozy7bBRHWQZZRH/aRtynsdz7IfYhgBX2oQBFAl6k42U8DpAeDnw8GKb5S849uNKFQF/+j/3bBc2VoyAw+zJVpQh0oANaJFgDcY4PsJYPEqpfREiX4DvGGN0/M56o7S/niUoWhM4cXrqlJxsq0GzmwHFq9WSugpErawMvNxy4G8G/AKrWhKnD28LijOGpGeAFZ8q+RW/AUrLkdySNnMeLGcJuKueriqqgwMDGTjxo0l5W957aqRkOn4fAToyDdm4mKMb1UQn+SX4wgQYyhgePyIj48PR4wYwYyMDBYWFvLo0aMuFhQUcN26dRw2bBgtFotXTUw3wZ1vKI7j5Rel4trWRfMD1HepioYeX27atCkzMzN56tQpesLJkyddxjVs6OU7Kjg/ATzyu2GDxHWT7WFhTTYe1sQ4AprHw7Ozs1kVnDlzhqmpqV5LdJofuO9V7RALzVBETq6crJuZFKK9+7BZLNJztwdJjyXl73PX5s2bRz8/P696iFPB73oJHs+1ToE5rugjYbxOIMjtw8OHD3cdcjH27dvHlJQUxsbGMi4ujsnJydy9ezfT09OvejjOdsx3IwXtS/xt8Bm9K0to9xAw3Kpdiuti7N27lzExMRTiQqXI3yEhITQMo2oNysn7fQUPPu2fBWPs5nKhjifcdDxZXlLhF4f93nvvrXVfUJ2cqgkW3GyWQZ+afxraMHe1L2tcltnFKpdhr5PuKKfo3uFBzrPv8GxAo0aN6s0AOcr3dAt3nv3IpjJYJhJQ3KZANpyLUyDFJ4SodQomC5X7k5qXQ5uzLQsByVUWoawAKUIAl4gwNDS0yiI0nEyBweK2iVnQ1++1oclMQgl2+7BsvbL7XW6ELL1zZZiWluYqw7lz51apDOVSM0uYrGw++kMYWwumYEAGoUV76v+yvdZpI2oHg+uVKDpavDEZsNtDldezDyFgktdWnJOTw6rgrE48Hq5BcCRCudFy12G2+zEMEvofu21ITCe0xlcdRtJjT5CpkprxNowi4MfX0YNF/hnzcQ5G+d4o8dpfDlgnEcL7OJatWaZENqjLx7G8520ca1DZH7H8WZ3nOBJcEI+LoW3eMxNDVhCWa+tlIREQbIUWfAPPc49l10xcgYqdVuXrTXmIn03orep0JQOEa8e8EY/wN217XhnKTLiDYS+OUlbklaDti3VohKAVzTgAj3OlsqN0u3E8Ct6glx+4QVmRW+qKhM+1bjRRdQoYtCKeHfEq31J3leTqJ25AVSBFqXyzOQ9DVxCBk89Wh1aNwzXXemeKsUxQVvAp36Lcr03peXVQts2UwnRVR1I6YU4i9GhCCTobFcVJcZbyt0GIINdmpTkPNtX3mOSf50gNqZy5JKTCiprCqCyI13/fNV+ZmX1YDMwgms0irMmEz0TCGEahS4538h4qljdoWDMZ3nTToWvbHrTd1M4ehbqCaS8OM7YWTdY/3feh/ta2LOcULdfvzD+tT99w2jJhS5nvmN1ZzvXO1mhq5ZQOM+yhqCL+B+AWe5nrKa3ZAAAAAElFTkSuQmCC",
                    uuid: crypto.randomUUID(),
                    rdns: "net.coinmeca.wallet",
                },
                provider: this,
            },
        });
    }

    #promise = async (method: string, params?: any) => {
        const chainId = this.chainId
        const app = {
            name: (document.querySelector('meta[property="og:site_name"]') as HTMLMetaElement)?.content || document.title?.split(" ")[0],
            url: window.location.host,
            logo: await getFaviconUri(),
        }

        return new Promise((resolve, reject) => {
            const messageHandler = (event: any) => {
                if (event.data.method === method) {
                    if (typeof event.data.result !== "undefined") resolve(event.data.result);
                    if (typeof event.data.error !== "undefined") reject(new Error(event.data.error));
                    // else reject(new Error("Request something wrong."));

                    window.removeEventListener("message", messageHandler);
                }

                if (event.data.close) {
                    reject(new Error(event.data.error));
                    window.removeEventListener("message", messageHandler);
                }
            };
            window.addEventListener("message", messageHandler);

            const popup: any = __confirm(method);
            if (!!popup) {
                const onLoad = (e: any) => {
                    if (popup?.coinmeca) popup.coinmeca = { ...popup.coinmeca, request: { method, params, app, chainId } };
                    else popup.coinmeca = { request: { method, params, app, chainId } };
                };
                popup.addEventListener("load", onLoad);

                const onClose = setInterval(() => {
                    if (popup.closed) {
                        clearInterval(onClose);
                        window.removeEventListener("load", onLoad);
                        window.removeEventListener("message", messageHandler);
                        reject(new Error("User closed the window before approving the request."));
                    }
                }, 100); // Check every 100ms
            }
        });
    };

    async request({ method, params }: { method: string; params?: any[] }) {
        switch (method) {
            case "eth_accounts":
                return this.#data()?.get('accounts');

            case "eth_requestAccounts":
                return await this.#promise(method).then((result) => {
                    if (result) {
                        this.#data()?.set('accounts', result)
                        return result
                    }
                });

            case "eth_coinbase":
                return;

            case "eth_chainId":
                return;

            case "net_version":
                return;

            case "eth_estimateGas":
                return;

            case "eth_gasPrice":
                return;

            case "eth_sign":
                return;

            case "eth_signTypedData_v4":
                return;

            case "personal_sign":
                return;

            case "eth_signTransaction":
                return;

            case "eth_sendTransaction":
                params = (Array.isArray(params) ? params[0] : params);
                if (!params) throw new Error("No transaction data provided");
                return await this.#promise(method, params).then((result) => {
                    if (result) return result
                });

            // Event Subscription
            case "eth_subscribe":
            case "eth_unsubscribe":
                return;
            case "eth_blockNumber":
                return;

            case "eth_getBalance":
                return;

            case "eth_getTransactionCount":
                return;

            case "eth_getCode":
                return;

            case "wallet_addEthereumChain":
                params = (Array.isArray(params) ? params[0] : params);
                if (!params) throw new Error("No chain information provided");
                return await this.#promise(method, params).then((result) => {
                    if (result) {
                        if (typeof result === 'number') this.emit("chainChanged", result);
                        return result;
                    }
                });

            case "wallet_switchEthereumChain":
                params = (Array.isArray(params) ? params[0] : params) as any;
                if (!(params as any)?.chainId) throw new Error("No chainId provided");
                return await this.#promise(method, (params as any)?.chainId).then((result) => {
                    if (result) {
                        this.#data()?.set('chain', getChainById(result as number))
                        this.emit("chainChanged", result);
                        return result;
                    }
                });

            case "wallet_watchAsset":
                return;

            default:
                throw new Error(`Method '${method}' not supported`);
        }
    }

    #data(_?: { key?: string; storage?: CloudStorage | Storage }) {
        const telegram = typeof window !== "undefined" ? (window as any).Telegram?.WebApp : undefined;
        const user = telegram?.initDataUnsafe?.user;
        const isTelegram = !!(telegram && user?.id);
        return loadStorage(this.codename, _?.storage || isTelegram ? telegram?.CloudStorage : localStorage, _?.storage ? false : isTelegram, _?.key);
    }

    get address() {
        return "0x1";
    }

    get chain() {
        return this.#data()?.get("chain");
    }

    get chainId() {
        return this.chain?.chainId || "0x1";
    }

    async getAddress() {
        return this.address;
    }

    async balance() {
        // if (this.address) return await this.#sendRpcRequest("eth_getBalance", [this.address, "latest"]);
        // else return 0;
        return 0;
    }

    async #rpcUrl() {
        const urls = (
            typeof this.chain?.rpcUrls === "object" ? Object.values(this.chain.rpcUrls) : Array.isArray(this.chain?.rpcUrls) ? this.chain.rpcUrls : []
        ).filter((url?: string) => url?.startsWith("http"));

        if (urls.length === 0) return null;
        const availableUrls = await Promise.all(
            urls.map(async (url: string) => {
                const start = Date.now();
                try {
                    await axiosQuiet.get(url); // Making the request
                    const elapsed = Date.now() - start;

                    // If the request is successful, return the URL and its latency
                    return { url, latency: elapsed };
                } catch {
                    // Return an object indicating failure without logging errors
                    return { url, latency: Number.MAX_SAFE_INTEGER };
                }
            }),
        );

        // Filter out URLs that resulted in an error
        const workingUrls = availableUrls.filter((result) => !!result && result.latency !== Number.MAX_SAFE_INTEGER).sort((a, b) => a.latency - b.latency);
        return workingUrls.length ? workingUrls[0].url : null;
    }
}
