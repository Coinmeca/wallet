import { getChainById } from "chains";
import { useStorage, useWallet } from "hooks";
import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Chain } from "types";
import { formatChainId } from "utils";

export interface AccountInfo {
    name: string;
    address: string;
    index: number;
    tokens?: {
        fts?: string[];
        nfts?: string[];
    };
}

interface AccountContextProps {
    account: AccountInfo | undefined;
    setAccount: React.Dispatch<React.SetStateAction<AccountInfo | undefined>>;
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

    const [account, setAccount] = useState<AccountInfo>();
    const [chain, setChain] = useState<Chain>();

    const updateChain = (chain?: string | number | Chain) => {
        chain = chain || storage?.get("last:chainId");
        if (chain) {
            if (typeof chain === 'string' || typeof chain === 'number') chain = getChainById(chain);
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
    }

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

        if (last.wallet) provider?.changeAccount(wallets[last.wallet]);
        if (!provider?.chainId || last.chainId !== provider?.chainId) updateChain(last.chainId);
    }, [account]);

    useEffect(() => {
        if (chain?.id !== provider?.chainId) updateChain(chain?.id);
    }, [chain, provider?.chainId]);

    return <AccountContext.Provider value={{ account, setAccount, chain, setChain: updateChain }}>{children}</AccountContext.Provider>;
};
