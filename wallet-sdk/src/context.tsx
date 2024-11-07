import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Chain, Account } from "./types";
import { CoinmecaWalletProvider } from "./provider";

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
    isPopup: boolean;
    popupId?: number;
}

const CoinmecaWalletContext = createContext<CoinmecaWalletProviderContextProps | undefined>(undefined);

export const useCoinmecaWallet = () => {
    const context = useContext(CoinmecaWalletContext);
    if (!context) throw new Error("InjectedWalletContext for useInjectedWallet doesn't initialized yet.");
    return context;
};

export const CoinmecaWalletContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [provider, setProvider] = useState<CoinmecaWalletProvider>();

    const [account, setAccount] = useState<Account>();
    const [chain, setChain] = useState();

    const [popupId, setPopupId] = useState<number>();
    const [isPopup, setIsPopup] = useState(false);

    useLayoutEffect(() => {
        if (typeof window !== "undefined") {
            const check = !!(window as any)?.coinmeca?.isPopup;
            if (check) {
                setIsPopup(check);
                const id = (window as any)?.coinmeca?.popupId;
                if (id) setPopupId(id);
            }
        }
        setProvider(new CoinmecaWalletProvider());
    }, []);

    useEffect(() => {
        const updateAccount = () => {
            setAccount(provider?.account);
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
    }, [provider]);

    return (
        <CoinmecaWalletContext.Provider value={{ provider, account, chain, accounts: provider?.accounts, chains: provider?.chains, popupId, isPopup }}>
            {children}
        </CoinmecaWalletContext.Provider>
    );
};
