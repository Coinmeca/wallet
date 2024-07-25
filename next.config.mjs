/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'https://api.coinmeca.net/:path*', // Proxy to Backend
            },
        ];
    },
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,OPTIONS' },
                    {
                        key: 'Access-Control-Allow-Headers',
                        value: 'Origin, Content-Type, Access-Control-Allow-Headers, DeviceInfo, Authorization, X-Requested-With',
                    },
                ],
            },
        ];
    },
    webpack(config) {
        config.module.rules.push({
            test: /\.svg$/,
            use: ['@svgr/webpack'],
        });
        return config;
    },
    i18n: {
        locales: ['en', 'es', 'fr', 'cn', 'jp', 'id', 'vi'],
        defaultLocale: 'en',
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'coinmeca-token-list.vercel.app',
            },
        ],
    },
    experimental: {
        // ppr: true,
    },
    compiler: {
        styledComponents: true,
    },
    swcMinify: true,
};

module.exports = nextConfig;
