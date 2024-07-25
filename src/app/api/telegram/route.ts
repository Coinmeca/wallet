import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';
import Wallet from 'ethereumjs-wallet';
import CryptoJS from 'crypto-js';

export interface TelegramResponse {
    text?: string;
    reply_markup?: {
        keyboard?: any[];
        resize_keyboard?: boolean;
        one_time_keyboard?: boolean;
    };
}

const createWalletFromToken = (token: string) => {
    const hash = CryptoJS.SHA256(token).toString();
    const privateKeyBuffer = Buffer.from(hash.substring(0, 64), 'hex');
    const wallet = Wallet.fromPrivateKey(privateKeyBuffer);
    return wallet;
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message } = body;

        if (message && message.text) {
            const chatId = message.chat.id;
            const text = message.text;

            let response: TelegramResponse = {};

            if (text.startsWith('/')) {
                // Handle commands
                switch (text) {
                    case '/start':
                        response.text = 'Welcome to the bot! Use /help to see available commands.';
                        break;
                    case '/wallet':
                        response.reply_markup = {
                            keyboard: [
                                [{ text: 'Button 1' }, { text: 'Button 2' }],
                                [{ text: 'Button 3' }, { text: 'Button 4' }],
                            ],
                            resize_keyboard: true,
                            one_time_keyboard: true,
                        };
                        break;
                    case '/create':
                        const wallet = createWalletFromToken(chatId);
                        response.text = `${chatId} => ${JSON.stringify(wallet)}`;
                        break;
                    case '/help':
                        response.text = 'Available commands: /start, /help, /info';
                        break;
                    case '/data':
                        response.text = JSON.stringify(message);
                        break;
                    case '/info':
                        response.text = `Your chat ID is ${chatId}`;
                        break;
                    default:
                        response.text = 'Unknown command. Use /help to see available commands.';
                }
            } else {
                // Handle other messages
                response.text = `You said: ${text}`;
            }

            // Send a response back to the Telegram chat
            const telegramApiUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_API_TOKEN}/sendMessage`;
            await fetch(telegramApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    ...response,
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
