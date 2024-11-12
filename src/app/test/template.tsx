import { CoinmecaWalletAdapterContextProvider } from "@coinmeca/wallet-sdk/contexts"

export default function Template({children}:{children?:any}) {
    return (
        <CoinmecaWalletAdapterContextProvider>{children}
        </CoinmecaWalletAdapterContextProvider>

    )
}