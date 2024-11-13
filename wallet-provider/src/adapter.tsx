"use client";

import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Chain, Account } from "@coinmeca/wallet-sdk/types";
import { CoinmecaWalletAdapter } from "@coinmeca/wallet-sdk/adapter";

// Inject the adapter into window.ethereum
declare global {
    interface Window {
        ethereum?: any;
        providers?: any;
        providersMaprovider?: Map<string, any>;
    }
}

interface CoinmecaWalletAdapterContextProps {
    adapter: CoinmecaWalletAdapter | undefined;
    account: Account | undefined;
    // accounts: Account[] | undefined;
    chain: Chain | undefined;
    // chains: Chain[] | undefined;
}

const CoinmecaWalletAdapterContext = createContext<CoinmecaWalletAdapterContextProps | undefined>(undefined);

export const useCoinmecaWallet = () => {
    const context = useContext(CoinmecaWalletAdapterContext);
    if (!context) throw new Error("InjectedWalletContext for useInjectedWallet doesn't initialized yet.");
    return context;
};

export const CoinmecaWalletAdapterContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [adapter, setAdapter] = useState<CoinmecaWalletAdapter>();

    const [account, setAccount] = useState<Account>();
    const [chain, setChain] = useState();

    useLayoutEffect(() => {
        setAdapter(new CoinmecaWalletAdapter());
    }, []);

    useEffect(() => {
        const updateAccount = () => {
            // setAccount(adapter?.account);
        };

        const updateChain = () => {
            // setChain(adapter?.chain);
        };

        adapter?.on("accountChanged", updateAccount);
        adapter?.on("chainChanged", updateChain);
        return () => {
            adapter?.off("accountChanged", updateAccount);
            adapter?.off("chainChanged", updateChain);
        };
    }, [adapter]);

    return <CoinmecaWalletAdapterContext.Provider value={{ adapter, account, chain }}>{children}</CoinmecaWalletAdapterContext.Provider>;
};
