import { getChainById } from "chains";
import { useStorage, useWallet } from "hooks";
import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Account, Chain } from "types";

interface AccountContextProps {
    account: Account | undefined;
    setAccount: React.Dispatch<React.SetStateAction<Account | undefined>>;
    chain: Chain | undefined;
    setChain: (chainId?: string | number | Chain) => void;
    // setChain: React.Dispatch<React.SetStateAction<Chain | undefined>>;
}

const AccountContext = createContext<AccountContextProps | undefined>(undefined);

export const useAccount = () => {
    const context = useContext(AccountContext);
    if (!context) throw new Error("AccountContext for useAccount doesn't initialized yet.");
    return context;
};

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { storage, session } = useStorage();
    const { provider } = useWallet();

    const [account, setAccount] = useState<Account>();
    const [chain, setChain] = useState<Chain>();

    const updateChain = (chain?: string | number | Chain) => {
        chain = chain || storage?.get("last:chainId");
        if (chain) {
            if (typeof chain === "string" || typeof chain === "number") chain = getChainById(chain);
            if (chain) {
                setChain(chain);
                provider?.changeChain({
                    chainId: chain.id,
                    chainName: chain.name,
                    nativeCurrency: chain.nativeCurrency,
                    rpcUrls: chain.rpc,
                    blockExplorerUrls: chain.explorer,
                });
            }
        }
    };

    const updateBalance = async (account?: Account) => {
        const balance = (await provider?.balance()) || 0;
        // setAccount((state) => {
        //     if (account || state) {
        //         return {
        //             ...(account || state),
        //             balance,
        //         } as Account;
        //     }
        //     return state;
        // });
    };

    useLayoutEffect(() => {
        const chainId = provider?.chainId || storage?.get("last:chainId");
        if (chainId) updateChain(chainId);
    }, []);

    useEffect(() => {
        const key = session?.get("key");
        const wallets = storage?.get(`${key}:wallets`);
        const last = {
            chainId: storage?.get("last:chainId"),
            wallet: storage?.get("last:wallet"),
        };

        if (!provider?.chainId || last.chainId !== provider?.chainId) updateChain(last.chainId);
        if (last.wallet) {
            const account = wallets?.[last.wallet];
            if (account) {
                provider?.changeAccount(account);
                updateBalance(account);
            }
        }
    }, [account]);

    useEffect(() => {
        if (chain?.id !== provider?.chainId) updateChain(chain?.id);
        updateBalance();
    }, [chain, provider?.chainId]);

    return <AccountContext.Provider value={{ account, setAccount, chain, setChain: updateChain }}>{children}</AccountContext.Provider>;
};
