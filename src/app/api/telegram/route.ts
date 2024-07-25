// app/api/telegram/route.js

import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message } = body;

        if (message && message.text) {
            const chatId = message.chat.id;
            const text = message.text;

            let responseText = '';

            if (text.startsWith('/')) {
                // Handle commands
                switch (text) {
                    case '/start':
                        responseText = 'Welcome to the bot! Use /help to see available commands.';
                        break;
                    case '/help':
                        responseText = 'Available commands: /start, /help, /info';
                        break;
                    case '/info':
                        responseText = `Your chat ID is ${chatId}`;
                        break;
                    default:
                        responseText = 'Unknown command. Use /help to see available commands.';
                }
            } else {
                // Handle other messages
                responseText = `You said: ${text}`;
            }

            // Send a response back to the Telegram chat
            const telegramApiUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_API_TOKEN}/sendMessage`;
            await fetch(telegramApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: responseText,
                }),
            });

            return NextResponse.json({ message: 'OK' });
        } else {
            return NextResponse.json({ error: 'Bad Request: No message data found' }, { status: 400 });
        }
    } catch (error) {
        console.error('Error handling the request:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ message: 'GET request not supported' }, { status: 405 });
}
