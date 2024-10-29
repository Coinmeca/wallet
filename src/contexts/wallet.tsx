import { getChainById } from "chains";
import { useStorage } from "hooks";
import React, { createContext, useContext, useLayoutEffect, useState } from "react";
import { CoinmecaWalletProvider } from "wallet/provider";

// Inject the provider into window.ethereum
declare global {
    interface Window {
        ethereum?: any;
        providers?: any;
        providersMap?: Map<string, any>;
    }
}

interface WalletProviderContextProps {
    provider: CoinmecaWalletProvider | undefined;
}

const WalletProviderContext = createContext<WalletProviderContextProps | undefined>(undefined);

export const useWallet = () => {
    const context = useContext(WalletProviderContext);
    if (!context) throw new Error("InjectedWalletContext for useInjectedWallet doesn't initialized yet.");
    return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { storage } = useStorage();
    const [provider, setProvider] = useState<CoinmecaWalletProvider>();

    useLayoutEffect(() => {
        const chain = getChainById(storage?.get('last:chainId') || 1)!;
        const walletProvider = new CoinmecaWalletProvider({chain:{
            chainId: chain.id,
            chainName: chain.name,
            nativeCurrency: chain.nativeCurrency,
            rpcUrls: chain.rpc,
            blockExplorerUrls: chain.explorer,
        }});
        setProvider(walletProvider);

        window.ethereum = { ...window.ethereum, ...walletProvider };
        window.ethereum.providers = window.ethereum.providers || [];
        if(!window.ethereum.providers.find((p:any) => p?.isCoinmecaWallet)) window.ethereum.providers.push(walletProvider);

        if (!window.ethereum.providerMap) window.ethereum.providerMap = new Map<string, any>(); // Ensure providerMap is initialized
        window.ethereum.providerMap.set("CoinmecaWallet", walletProvider);

        const announceProvider = new CustomEvent("eip6963:announceProvider", {
            detail: {
                info: {
                    name: "Coinmeca Wallet",
                    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAFT0lEQVR4AbVWBWxbVxQ975ND3+GkzBBORmVmZqYxB8bMvBXGaQdWmSHpmJkXLDMF1YBaq3O5Z35WubYbPNKR7E/vwrmAqsLeeF3okeavTSlvOsJW3CYxa39is7I9XcJP7xkaePrAjIDyg0/5Z9kXB3x0/F//ydxuhqGuUG5ujyryX23bYNxxaL3SnrMQwBRonCwUjhSCoxTBqarg/T6C74ULftdDcM+L6mH7j8b8438Y8agp/sJf1h2WrTN/UtMdr6E7RyKE7aAzCIIWgKqTylnK3/JaiADjFHCaLzg/HtzxmuJw5Bozy7bBRHWQZZRH/aRtynsdz7IfYhgBX2oQBFAl6k42U8DpAeDnw8GKb5S849uNKFQF/+j/3bBc2VoyAw+zJVpQh0oANaJFgDcY4PsJYPEqpfREiX4DvGGN0/M56o7S/niUoWhM4cXrqlJxsq0GzmwHFq9WSugpErawMvNxy4G8G/AKrWhKnD28LijOGpGeAFZ8q+RW/AUrLkdySNnMeLGcJuKueriqqgwMDGTjxo0l5W957aqRkOn4fAToyDdm4mKMb1UQn+SX4wgQYyhgePyIj48PR4wYwYyMDBYWFvLo0aMuFhQUcN26dRw2bBgtFotXTUw3wZ1vKI7j5Rel4trWRfMD1HepioYeX27atCkzMzN56tQpesLJkyddxjVs6OU7Kjg/ATzyu2GDxHWT7WFhTTYe1sQ4AprHw7Ozs1kVnDlzhqmpqV5LdJofuO9V7RALzVBETq6crJuZFKK9+7BZLNJztwdJjyXl73PX5s2bRz8/P696iFPB73oJHs+1ToE5rugjYbxOIMjtw8OHD3cdcjH27dvHlJQUxsbGMi4ujsnJydy9ezfT09OvejjOdsx3IwXtS/xt8Bm9K0to9xAw3Kpdiuti7N27lzExMRTiQqXI3yEhITQMo2oNysn7fQUPPu2fBWPs5nKhjifcdDxZXlLhF4f93nvvrXVfUJ2cqgkW3GyWQZ+afxraMHe1L2tcltnFKpdhr5PuKKfo3uFBzrPv8GxAo0aN6s0AOcr3dAt3nv3IpjJYJhJQ3KZANpyLUyDFJ4SodQomC5X7k5qXQ5uzLQsByVUWoawAKUIAl4gwNDS0yiI0nEyBweK2iVnQ1++1oclMQgl2+7BsvbL7XW6ELL1zZZiWluYqw7lz51apDOVSM0uYrGw++kMYWwumYEAGoUV76v+yvdZpI2oHg+uVKDpavDEZsNtDldezDyFgktdWnJOTw6rgrE48Hq5BcCRCudFy12G2+zEMEvofu21ITCe0xlcdRtJjT5CpkprxNowi4MfX0YNF/hnzcQ5G+d4o8dpfDlgnEcL7OJatWaZENqjLx7G8520ca1DZH7H8WZ3nOBJcEI+LoW3eMxNDVhCWa+tlIREQbIUWfAPPc49l10xcgYqdVuXrTXmIn03orep0JQOEa8e8EY/wN217XhnKTLiDYS+OUlbklaDti3VohKAVzTgAj3OlsqN0u3E8Ct6glx+4QVmRW+qKhM+1bjRRdQoYtCKeHfEq31J3leTqJ25AVSBFqXyzOQ9DVxCBk89Wh1aNwzXXemeKsUxQVvAp36Lcr03peXVQts2UwnRVR1I6YU4i9GhCCTobFcVJcZbyt0GIINdmpTkPNtX3mOSf50gNqZy5JKTCiprCqCyI13/fNV+ZmX1YDMwgms0irMmEz0TCGEahS4538h4qljdoWDMZ3nTToWvbHrTd1M4ehbqCaS8OM7YWTdY/3feh/ta2LOcULdfvzD+tT99w2jJhS5nvmN1ZzvXO1mhq5ZQOM+yhqCL+B+AWe5nrKa3ZAAAAAElFTkSuQmCC",
                    uuid: crypto.randomUUID(),
                    rdns: "net.coinmeca.wallet",
                },
                provider: walletProvider,
            },
        });

        window.dispatchEvent(announceProvider);
    }, []);

    return <WalletProviderContext.Provider value={{ provider }}>{children}</WalletProviderContext.Provider>;
};
