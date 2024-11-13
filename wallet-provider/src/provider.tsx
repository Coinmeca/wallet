"use client";

<<<<<<< HEAD:wallet-provider/src/provider.tsx
import React, { createContext, useContext, useLayoutEffect, useState } from "react";
import { Chain, Account, App } from "@coinmeca/wallet-sdk/types";
import { CoinmecaWalletProvider } from "@coinmeca/wallet-sdk/provider";
=======
import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
import { Chain, Account, App } from "../types";
import { CoinmecaWalletProvider } from "../provider";

// Inject the provider into window.ethereum
declare global {
    interface Window {
        ethereum?: any;
        providers?: any;
        providersMaprovider?: Map<string, any>;
    }
}
>>>>>>> cae5a2f20085fc39f2128145c8a294bbae633214:wallet-sdk/src/contexts/provider.tsx

interface CoinmecaWalletProviderContextProps {
    provider: CoinmecaWalletProvider | undefined;
    account: Account | undefined;
    accounts: Account[] | undefined;
    chain: Chain | undefined;
    chains: Chain[] | undefined;
    apps: App[] | undefined;
}

const CoinmecaWalletContext = createContext<CoinmecaWalletProviderContextProps | undefined>(undefined);

export const useCoinmecaWalletProvider = () => {
    const context = useContext(CoinmecaWalletContext);
    if (!context) throw new Error("InjectedWalletContext for useInjectedWallet doesn't initialized yet.");
    return context;
};

export const CoinmecaWalletContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [provider, setProvider] = useState<CoinmecaWalletProvider>();

    const [account, setAccount] = useState<Account>();
    const [chain, setChain] = useState();

    useLayoutEffect(() => {
<<<<<<< HEAD:wallet-provider/src/provider.tsx
        const chainId = (window as any)?.coinmeca?.request?.chainId;
        const provider = (window as any)?.coinmeca?.wallet || new CoinmecaWalletProvider({ chainId });
        setProvider(provider);
=======
        setProvider(
            new CoinmecaWalletProvider({
                chainId: (window as any)?.coinmeca?.request?.chainId,
            }),
        );
>>>>>>> cae5a2f20085fc39f2128145c8a294bbae633214:wallet-sdk/src/contexts/provider.tsx
    }, []);

    useLayoutEffect(() => {
        if (provider) {
            const updateAccount = () => {
                setAccount(provider?.account());
            };

            const updateChain = () => {
                setChain(provider?.chain);
            };

<<<<<<< HEAD:wallet-provider/src/provider.tsx
            const updateApps = () => {};

            const updateFungibles = () => {
                setAccount(provider?.account());
            };

=======
>>>>>>> cae5a2f20085fc39f2128145c8a294bbae633214:wallet-sdk/src/contexts/provider.tsx
            const update = () => {
                updateAccount();
                updateChain();
            };

            provider?.on("unlock", update);
            provider?.on("accountChanged", updateAccount);
            provider?.on("chainChanged", updateChain);
            return () => {
                provider?.off("unlock", update);
                provider?.off("accountChanged", updateAccount);
                provider?.off("chainChanged", updateChain);
            };
        }
    }, [provider]);

    return (
        <CoinmecaWalletContext.Provider value={{ provider, account, chain, accounts: provider?.accounts() as Account[], chains: provider?.chains, apps:provider?.apps }}>
            {children}
        </CoinmecaWalletContext.Provider>
    );
};
