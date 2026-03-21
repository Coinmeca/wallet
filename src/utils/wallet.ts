const host = {
    wallet: "https://wallet.coinmeca.net",
    web3: "https://web3.coinmeca.net/",
    media: "https://coinmeca.net/",
};

const env = (key: string) => {
    if (typeof process === "undefined") return;
    return process.env[key];
};

const envAny = (...keys: string[]) => {
    for (const key of keys) {
        const value = env(key);
        if (typeof value === "string" && value.trim() !== "") return value;
    }
    return;
};

export const debug = () => {
    if (typeof process === "undefined") return false;
    return process.env.NEXT_PUBLIC_ENABLE_TEST_ROUTE === "true" || process.env.NODE_ENV !== "production";
};

const base = (value?: string | URL, key = "NEXT_PUBLIC_WALLET_URL", fallback = host.wallet, preferCurrent = false) => {
    const current = preferCurrent && typeof window !== "undefined" ? window.location.origin : undefined;
    try {
        return new URL(value || envAny(key) || current || fallback);
    } catch {
        return new URL(fallback);
    }
};

export const origin = (value?: string | URL) => base(value, "NEXT_PUBLIC_WALLET_URL", host.wallet, true).origin;

export const wallet = (path = "/", value?: string | URL) => {
    return new URL(path, base(value, "NEXT_PUBLIC_WALLET_URL", host.wallet, true)).toString();
};

export const web3 = (path = "/", value?: string | URL) => {
    return new URL(path, value || envAny("NEXT_PUBLIC_WEB3_URL", "METADATA_URL") || host.web3).toString();
};

export const media = (path = "/", value?: string | URL) => {
    return new URL(path, base(value, "NEXT_PUBLIC_MEDIA_URL", host.media)).toString();
};

export const video = (name = "1.mp4") => {
    return media(`img/video/${name}`);
};

export const chainLogo = (chainId?: string | number, logo?: string) => {
    return logo || (chainId || chainId === 0 ? web3(`${chainId}/logo.svg`) : undefined);
};

export const tokenLogo = (chainId?: string | number, address?: string, logo?: string) => {
    return logo || (chainId || chainId === 0 ? (address ? web3(`${chainId}/${address.toLowerCase()}/logo.svg`) : undefined) : undefined);
};
