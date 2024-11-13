import typescript from "@rollup/plugin-typescript";
import obfuscator from "rollup-plugin-obfuscator";
import { terser } from "rollup-plugin-terser";

export default {
    input: "src/index.ts",
    output: {
        name: "@coinmeca/wallet-sdk",
        file: "dist/bundle.js",
        format: "iife",
        sourcemap: true,
        extend: true,
        globals: {
            react: "React",
            "react/jsx-runtime": "jsxRuntime",
            eventemitter3: "EventEmitter",
            axios: "axios",
            "crypto-js": "CryptoJS",
            "ethereumjs-wallet": "ethereumjsWallet",
            "ethereumjs-tx": "ethereumjsTx",
            "ethereumjs-util": "ethereumjsUtil",
        },
    },
    exclude: ["src/contexts/**/*"],
    external: ["react", "react/jsx-runtime", "eventemitter3", "axios", "crypto-js", "ethereumjs-wallet", "ethereumjs-tx", "ethereumjs-util"],
    plugins: [
        typescript({
            tsconfig: "./tsconfig.rollup.json",
            // sourceMap: true,
            // declaration: true,
            exclude: ["src/contexts/**/*"], // Exclude the context folder from bundling
        }),
        obfuscator({
            compact: true, // Compresses the code to reduce size and obfuscate it more effectively.
            controlFlowFlattening: true, // Use control flow flattening to make the code more difficult to follow.
            controlFlowFlatteningThreshold: 0.75, // Strong control flow flattening, applied to 75% of the code to increase obfuscation.
            deadCodeInjection: true, // Adds fake, unused code to make reverse-engineering harder.
            deadCodeInjectionThreshold: 0.4, // Apply dead code injection to 40% of the code.
            debugProtection: true, // Makes it difficult to debug the obfuscated code (useful for protecting against reverse-engineering).
            debugProtectionInterval: 1000, // The interval in milliseconds at which the protection mechanism is applied.
            disableConsoleOutput: true, // Disable console outputs to prevent leakage of debug information.
            // domainLock: ["yourwebsite.com"], // Limit the code to only run from your specified domain (e.g., your website).
            // domainLockRedirectUrl: "about:blank", // If someone tries to run the code outside the allowed domain, it redirects to a blank page.
            forceTransformStrings: ["localStorage", "sessionStorage", "CloudStorage", "seed", "key", "keys", "privateKey"], // Force encryption of strings related to sensitive storage like `localStorage`.
            identifierNamesCache: null, // Do not use a cache for generated identifier names, ensuring maximum randomness.
            identifierNamesGenerator: "hexadecimal", // Use hexadecimal strings for variable and function names, making them hard to guess.
            identifiersDictionary: [], // Use random identifiers (no dictionary to avoid patterns).
            identifiersPrefix: "", // Avoid prefixing identifiers to make them even more obscure.
            ignoreImports: false, // Do not ignore imports, ensuring that all parts of the code are obfuscated.
            inputFileName: "", // Leave empty for the obfuscator to auto-generate the name.
            log: false, // Disable logging to avoid unnecessary information leakage.
            numbersToExpressions: true, // Convert numbers to expressions, making them harder to deduce.
            optionsPreset: "high-obfuscation", // Use a preset configuration focused on high-level obfuscation.
            renameGlobals: false, // Don't rename global variables as they might interfere with the functionality.
            renameProperties: true, // Rename object properties to obfuscate the code further.
            renamePropertiesMode: "safe", // Ensure object properties are renamed safely to prevent breaking the code.
            reservedNames: [], // No reserved names as we want to obfuscate everything.
            reservedStrings: [], // No reserved strings, we want to encrypt all string literals.
            seed: "coinmeca:wallet", // Provide a fixed seed for deterministic obfuscation (if needed).
            selfDefending: true, // Protects against runtime deobfuscation techniques.
            simplify: false, // Do not simplify the code after obfuscation, as this might undo some of the protection.
            sourceMap: false, // Do not generate source maps to prevent reverse engineering.
            sourceMapBaseUrl: "", // Base URL for the source map if enabled (we’re not using it here).
            sourceMapFileName: "", // Filename for source maps (again, we’re not using them).
            sourceMapMode: "separate", // Source maps would be separate if enabled, but we're disabling them.
            sourceMapSourcesMode: "sources-content", // If we were using source maps, we'd embed source content.
            splitStrings: true, // Split strings into smaller chunks for encryption.
            splitStringsChunkLength: 10, // Split strings into chunks of 10 characters to increase obfuscation.
            stringArray: true, // Encrypt all string literals (e.g., sensitive values).
            stringArrayCallsTransform: true, // Transform calls to string array to obfuscate the access to encrypted strings.
            stringArrayCallsTransformThreshold: 0.5, // Apply string array transformation to 50% of string accesses.
            stringArrayEncoding: ["base64"], // Use base64 encoding to obscure string literals.
            stringArrayIndexesType: ["hexadecimal-number"], // Use hexadecimal indexes to access the string array.
            stringArrayIndexShift: true, // Shift the string array index to further obscure the access pattern.
            stringArrayRotate: true, // Rotate the string array to make it harder to predict.
            stringArrayShuffle: true, // Shuffle the string array, so the order is unpredictable.
            stringArrayWrappersCount: 1, // Use only 1 wrapper function for accessing string array elements.
            stringArrayWrappersChainedCalls: true, // Chain the calls to string array functions to add complexity.
            stringArrayWrappersParametersMaxCount: 2, // Use a maximum of 2 parameters for each wrapper function.
            stringArrayWrappersType: "variable", // Use variables for string array wrappers.
            stringArrayThreshold: 0.75, // Apply string array obfuscation to 75% of the string literals.
            target: "browser", // Target browser environments.
            transformObjectKeys: true, // Obfuscate object keys to make them harder to guess.
            unicodeEscapeSequence: true, // Escape characters in string literals to make them unreadable.
        }),
        terser(), // Minify the output JavaScript code
    ],
};
