"use client";

import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
import { Chain, Account, App, Tokens } from "../types";
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
    apps: App[] | undefined;
    tokens: {
        fungibles?: string[];
        nonFungibles?: string[];
        multiTokens?: string[];
    };
}

const CoinmecaWalletContext = createContext<CoinmecaWalletProviderContextProps | undefined>(undefined);

export const useCoinmecaWalletProvider = () => {
    const context = useContext(CoinmecaWalletContext);
    if (!context) throw new Error("InjectedWalletContext for useInjectedWallet doesn't initialized yet.");
    return context;
};

export const CoinmecaWalletContextProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const [provider, setProvider] = useState<CoinmecaWalletProvider>();

    const [account, setAccount] = useState<Account>();
    const [chain, setChain] = useState<Chain>();

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
                console.log(provider?.chain);
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
        <CoinmecaWalletContext.Provider
            value={{
                provider,
                account,
                chain,
                accounts: provider?.accounts() as Account[],
                chains: provider?.chains,
                apps: provider?.apps,
                tokens: {
                    fungibles: chain?.chainId ? account?.tokens?.fungibles?.[`${chain?.chainId}`] : undefined,
                    nonFungibles: chain?.chainId ? account?.tokens?.nonFungibles?.[`${chain?.chainId}`] : undefined,
                    multiTokens: chain?.chainId ? account?.tokens?.multiTokens?.[`${chain?.chainId}`] : undefined,
                },
            }}>
            {children}
        </CoinmecaWalletContext.Provider>
    );
};
