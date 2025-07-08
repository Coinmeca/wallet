import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { code } = await req.json();

    const params = new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: "authorization_code",
        code,
        redirect_uri: "https://wallet.coinmeca.net/api/discord", // Leave blank for activities
    });

    const res = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        body: params,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });

    const data = await res.json();
    return NextResponse.json(data);
}
