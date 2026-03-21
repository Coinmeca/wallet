import { NextRequest, NextResponse } from "next/server";

const json = (error: string, status: number, details?: string) =>
    NextResponse.json(details ? { error, details } : { error }, { status, headers: { "Cache-Control": "no-store" } });

const same = (req: NextRequest) => {
    const origin = req.headers.get("origin");
    return !origin || origin === req.nextUrl.origin;
};

const body = async (req: NextRequest) => {
    try {
        return await req.json();
    } catch {
        return;
    }
};

export async function POST(req: NextRequest) {
    if (!same(req)) return json("Unauthorized origin", 403);

    const client = process.env.DISCORD_CLIENT_ID;
    const secret = process.env.DISCORD_CLIENT_SECRET;
    if (!client || !secret) return json("Discord auth is not configured.", 503);

    const input = await body(req);
    if (!input) return json("Invalid request body", 400);

    const { code } = input;
    if (!code || typeof code !== "string") return json("Missing authorization code", 400);

    const params = new URLSearchParams({
        client_id: client,
        client_secret: secret,
        grant_type: "authorization_code",
        code,
    });

    const res = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        body: params,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });

    const data = await res.json();
    if (!res.ok) return json("Discord token exchange failed", res.status, data?.error_description || data?.error || "Unknown Discord error");
    if (!data?.access_token) return json("Discord token exchange failed", 502, "Missing access token");

    return NextResponse.json({ access_token: data.access_token }, { headers: { "Cache-Control": "no-store" } });
}
