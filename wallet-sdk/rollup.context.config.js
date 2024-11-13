import typescript from "@rollup/plugin-typescript";

export default {
    input: "src/contexts/index.ts", // Path to your main entry JavaScript file
    external: ["react", "react/jsx-runtime", "eventemitter3", "axios", "crypto-js", "ethereumjs-wallet", "ethereumjs-tx", "ethereumjs-util"],
    plugins: [
        typescript({
            tsconfig: "src/contexts/tsconfig.json",
            sourceMap: true,
            declaration: true,
        }),
    ],
};
