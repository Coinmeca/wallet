"use client";

import { CoinmecaWalletAdapterContextProvider } from "@coinmeca/wallet-provider";

export default function Layout({ children }: any) {
    return <CoinmecaWalletAdapterContextProvider>{children}</CoinmecaWalletAdapterContextProvider>;
}
