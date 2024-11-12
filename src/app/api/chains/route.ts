import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, res: NextResponse) {
    try {
        // Perform any additional processing here (e.g., logging, validation)
        console.log("Fetching RPC URLs...");

        const url = new URL(req.url);
        const path = url.pathname.replace("/api/chainlist/", ""); // Extract path after '/api/chainlist/'

        // Fetch from the external API (after performing any necessary transformations)
        const externalResponse = await fetch(`https://chainlist.org/api/${path}`);
        const data = await externalResponse.json();

        return NextResponse.json(data); // Return the response back to the client
    } catch (error) {
        console.error("Error fetching data:", error);
        return NextResponse.json({ error: "Failed to fetch RPC URLs" }, { status: 500 });
    }
}
