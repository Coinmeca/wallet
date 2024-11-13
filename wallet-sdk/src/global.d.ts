export { };

declare global {
    interface Window {
        ethereum?: {
            providers?: any[] | undefined;
            providerMap?: Map<string, any> | undefined;
            isCoinmecaWallet?: boolean | undefined;
            [key: string]: any;
        }
        coinmeca?: {
            isPopup?: boolean;
            popupId?: string;
            wallet?: any;
            request?: {
                chainId?: string | number;
                app?: any;
                method?: string;
                params?: any;
                [key: string]: any;
            }
            [key: string]: any;
        };
    }
}