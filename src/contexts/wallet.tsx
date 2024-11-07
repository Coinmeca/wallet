import { getChainById } from "chains";
import { useStorage } from "hooks";
import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
import { Account } from "types";
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
    account: Account | undefined;
}

const WalletProviderContext = createContext<WalletProviderContextProps | undefined>(undefined);

export const useWallet = () => {
    const context = useContext(WalletProviderContext);
    if (!context) throw new Error("InjectedWalletContext for useInjectedWallet doesn't initialized yet.");
    return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [account, setAccount] = useState<Account>();
    const [provider, setProvider] = useState<CoinmecaWalletProvider>();

    useEffect(() => {
        const provider = new CoinmecaWalletProvider();
        setProvider(provider);

        const updateAccount = () => {
            setAccount(provider?.account);
        }
        
        provider?.on("accountChanged", updateAccount);
        return () => {
            provider?.off("accountChanged", updateAccount);
        }
    }, []);

    return <WalletProviderContext.Provider value={{ provider, account }}>{children}</WalletProviderContext.Provider>;
};
