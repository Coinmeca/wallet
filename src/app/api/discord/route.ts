import "dotenv/config";
import { InteractionType, InteractionResponseType, verifyKey } from "discord-interactions";
import { getRandomEmoji } from "./utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const signature = req.headers.get("x-signature-ed25519");
    const timestamp = req.headers.get("x-signature-timestamp");

    // Check if signature or timestamp is null
    if (!signature || !timestamp) {
        return NextResponse.json({ error: "Missing signature or timestamp" }, { status: 400 });
    }

    const rawBody = await req.text();

    // Verify the request using the public key
    try {
        verifyKey(rawBody, signature, timestamp, process.env.PUBLIC_KEY!);
    } catch (err) {
        return NextResponse.json({ error: "Bad request signature" }, { status: 401 });
    }

    // Parse the JSON body after verification
    const body = JSON.parse(rawBody);
    const { type, data } = body;

    // Handle verification requests
    if (type === InteractionType.PING) {
        return NextResponse.json({ type: InteractionResponseType.PONG });
    }

    // Handle slash command requests
    if (type === InteractionType.APPLICATION_COMMAND) {
        const { name } = data;

        // "test" command
        if (name === "test") {
            // Send a message into the channel where the command was triggered from
            return NextResponse.json({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: `hello world ${getRandomEmoji()}`,
                },
            });
        }

        console.error(`unknown command: ${name}`);
        return NextResponse.json({ error: "unknown command" }, { status: 400 });
    }

    console.error("unknown interaction type", type);
    return NextResponse.json({ error: "unknown interaction type" }, { status: 400 });
}
