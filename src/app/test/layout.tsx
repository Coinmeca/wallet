'use client';

import { CoinmecaWalletAdapterContextProvider } from "@coinmeca/wallet-sdk/contexts"

export default function Layout({children}: any) {
    return <CoinmecaWalletAdapterContextProvider>{children}</CoinmecaWalletAdapterContextProvider>
}