import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Account } from "types";
import { Chain, CoinmecaWalletProvider } from "wallet/provider";

// Inject the provider into window.ethereum
declare global {
    interface Window {
        ethereum?: any;
        providers?: any;
        providersMaprovider?: Map<string, any>;
    }
}

interface WalletProviderContextProps {
    provider: CoinmecaWalletProvider | undefined;
    account: Account | undefined;
    chain: Chain | undefined;
}

const WalletProviderContext = createContext<WalletProviderContextProps | undefined>(undefined);

export const useWallet = () => {
    const context = useContext(WalletProviderContext);
    if (!context) throw new Error("InjectedWalletContext for useInjectedWallet doesn't initialized yet.");
    return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [account, setAccount] = useState<Account>();
    const [chain, setChain] = useState();
    const [provider, setProvider] = useState<CoinmecaWalletProvider>();

    useLayoutEffect(() => {
        setProvider(new CoinmecaWalletProvider());
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

    return <WalletProviderContext.Provider value={{ provider, account, chain }}>{children}</WalletProviderContext.Provider>;
};
