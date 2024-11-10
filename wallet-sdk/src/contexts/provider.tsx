"use client";

import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
import { Chain, Account } from "../types";
import { CoinmecaWalletProvider } from "../provider";

// Inject the provider into window.ethereum
declare global {
    interface Window {
        ethereum?: any;
        providers?: any;
        providersMaprovider?: Map<string, any>;
    }
}

interface CoinmecaWalletProviderContextProps {
    provider: CoinmecaWalletProvider | undefined;
    account: Account | undefined;
    accounts: Account[] | undefined;
    chain: Chain | undefined;
    chains: Chain[] | undefined;
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
        setProvider(
            new CoinmecaWalletProvider({
                chainId: (window as any)?.coinmeca?.request?.chainId,
            }),
        );
    }, []);

    useLayoutEffect(() => {
        if (provider) {
            const updateAccount = () => {
                setAccount(provider?.account());
            };

            const updateChain = () => {
                setChain(provider?.chain);
            };

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
        <CoinmecaWalletContext.Provider value={{ provider, account, chain, accounts: provider?.accounts() as Account[], chains: provider?.chains }}>
            {children}
        </CoinmecaWalletContext.Provider>
    );
};
