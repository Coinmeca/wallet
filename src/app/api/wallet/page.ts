import { NextRequest } from "next/server";

// app/api/injectWallet/route.js
export async function GET(req: NextRequest) {
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*'); // Change '*' to your specific origin in production
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');

    // Handle pre-flight CORS request
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: headers,
        });
    }

    // Your wallet provider class as a script
    const walletProviderClass = `
    class CustomWalletProvider {
      constructor() {
        // Initialization code for your wallet provider
      }

      connect() {
        // Logic for connecting the wallet
      }

      // Other wallet provider methods...
    }
    
    // Inject the wallet provider into the window object
    window.CustomWalletProvider = CustomWalletProvider;
  `;

    // Return the script in the response
    return new Response(walletProviderClass, {
        status: 200,
        headers: {
            'Content-Type': 'application/javascript',
            ...Object.fromEntries(headers), // Add other headers
        },
    });
}
