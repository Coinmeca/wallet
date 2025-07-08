/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                    {
                        key: "Content-Security-Policy",
                        value: [
                            "default-src 'self'",
                            "script-src 'self' https://static.cloudflareinsights.com",
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",
                            "font-src 'self' https://fonts.gstatic.com",
                            "img-src 'self' data: https://web3.coinmeca.net",
                            "connect-src 'self' https: data: blob: https://telegram.org",
                            "frame-ancestors 'self' https://*.coinmeca.net https://web.telegram.org https://*.telegram.org https://telegram.org https://t.me https://*.discordsays.com",
                            "base-uri 'self'",
                        ].join("; "),
                    },
                ],
            },
            {
                source: "/api/:path*",
                headers: [
                    { key: "Access-Control-Allow-Origin", value: "*" },
                    { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,OPTIONS" },
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
