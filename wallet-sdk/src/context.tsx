import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Chain, Account } from "./types";
import { CoinmecaWalletProvider as WalletProvider } from "./provider";

// Inject the provider into window.ethereum
declare global {
    interface Window {
        ethereum?: any;
        providers?: any;
        providersMaprovider?: Map<string, any>;
    }
}

interface CoinmecaWalletProviderContextProps {
    provider: WalletProvider | undefined;
    account: Account | undefined;
    chain: Chain | undefined;
}

const CoinmecaWalletProviderContext = createContext<CoinmecaWalletProviderContextProps | undefined>(undefined);

export const useCoinmecaWallet = () => {
    const context = useContext(CoinmecaWalletProviderContext);
    if (!context) throw new Error("InjectedWalletContext for useInjectedWallet doesn't initialized yet.");
    return context;
};

export const CoinmecaWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [account, setAccount] = useState<Account>();
    const [chain, setChain] = useState();
    const [provider, setProvider] = useState<WalletProvider>();

    useLayoutEffect(() => {
        setProvider(new WalletProvider());
    }, []);

    useEffect(() => {
        const updateAccount = () => {
            setAccount(provider?.account);
        };

        const updateChain = () => {
            if (provider?.chain) setChain(provider?.chain);
        };

        provider?.on("unlock", updateAccount);
        provider?.on("accountChanged", updateAccount);
        provider?.on("chainChanged", updateChain);
        return () => {
            provider?.off("unlock", updateAccount);
            provider?.off("accountChanged", updateAccount);
            provider?.off("chainChanged", updateChain);
        };
    }, [provider]);

    return <CoinmecaWalletProviderContext.Provider value={{ provider, account, chain }}>{children}</CoinmecaWalletProviderContext.Provider>;
};
