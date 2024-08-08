import { InteractionType, InteractionResponseType, verifyKey } from "discord-interactions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const signature = req.headers.get("x-signature-ed25519");
    const timestamp = req.headers.get("x-signature-timestamp");

    if (!signature || !timestamp) {
        return NextResponse.json({ error: "Missing signature or timestamp" }, { status: 400 });
    }

    const rawBody = await req.text();

    try {
        verifyKey(rawBody, signature, timestamp, process.env.PUBLIC_KEY!);
    } catch (err) {
        return NextResponse.json({ error: "Bad request signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const { type } = body;

    if (type === InteractionType.PING) {
        return NextResponse.json({ type: InteractionResponseType.PONG });
    }

    // Handle other interaction types...
}
