/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: "/api/language/:code",
                destination: `${process.env.LANG_URL ? `${process.env.LANG_URL}?service=wallet&lang=` : "https://wallet.coinmeca.net/api/language/"}:code`,
            },
        ];
    },
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                ],
            },
            {
                source: "/api/:path*",
                headers: [
                    { key: "Vary", value: "Origin" },
                ],
            },
            {
                source: "/api/telegram",
                headers: [
                    { key: "Access-Control-Allow-Origin", value: "*" },
                    { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
                    {
                        key: "Access-Control-Allow-Headers",
                        value: "Origin, Content-Type, Access-Control-Allow-Headers, DeviceInfo, Authorization, X-Requested-With",
                    },
                ],
            },
            {
                source: "/api/discord",
                headers: [
                    { key: "Access-Control-Allow-Origin", value: "*" },
                    { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
                    {
                        key: "Access-Control-Allow-Headers",
                        value: "Origin, Content-Type, Access-Control-Allow-Headers, DeviceInfo, Authorization, X-Requested-With",
                    },
                ],
            },
            {
                source: "/sw.js",
                headers: [
                    { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
                    { key: "Content-Type", value: "application/javascript; charset=utf-8" },
                ],
            },
        ];
    },
    webpack(config) {
        config.module.rules.push({
            test: /\.svg$/,
            use: ["@svgr/webpack"],
        });
        return config;
    },
    i18n: {
        locales: ["en", "es", "fr", "cn", "jp", "id", "vi"],
        defaultLocale: "en",
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "web3.coinmeca.net",
            },
            {
                protocol: "https",
                hostname: "*",
            },
        ],
    },
    experimental: {
        // ppr: true,
    },
    compiler: {
        styledComponents: true,
    },
};

module.exports = nextConfig;
