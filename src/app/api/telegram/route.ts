import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';
import Wallet from 'ethereumjs-wallet';
import CryptoJS from 'crypto-js';

export interface KeyboardButton {
    text: string;
    // request_users?: KeyboardButtonRequestUsers;
    // request_chat?: KeyboardButtonRequestChat;
    request_contact?: boolean;
    request_location?: boolean;
    // request_poll?: KeyboardButtonPollType;
    web_app?: { url: string };
}

export interface InlineKeyboardButton {
    text: string;
    url?: string;
    callback_data?: string;
    web_app?: { url: string };
    login_url?: {
        url: string;
        forward_text?: string;
        bot_username?: string;
        request_write_access?: boolean;
    };
    switch_inline_query?: string;
    switch_inline_query_current_chat?: string;
    pay?: boolean;
}

export interface InlineKeyboardMarkup {
    inline_keyboard?: InlineKeyboardButton[][];
}

export interface ReplyKeyboardMarkup {
    keyboard: KeyboardButton[][];
    is_persistent?: boolean;
    resize_keyboard?: boolean;
    one_time_keyboard?: boolean;
    input_field_placeholder?: string;
    selective?: boolean;
}

export interface ReplyKeyboardRemove {
    remove_keyboard: boolean;
    selective?: boolean;
}

export interface TelegramResponse {
    chat_id: number;
    text: string;
    business_connection_id?: string;
    message_thread_id?: number;
    parse_mode?: string;
    entities?: any[];
    // link_preview_options?: LinkPreviewOptions;
    disable_notification?: boolean;
    protect_content?: boolean;
    message_effect_id?: string;
    // reply_parameters?: ReplyParameters;
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup;
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

            let response: TelegramResponse = {
                chat_id: chatId,
                text: '',
            };

            if (text.startsWith('/')) {
                // Handle commands
                switch (text) {
                    case '/start':
                        response.text = 'Welcome to the bot! Use /help to see available commands.';
                        break;
                    case '/wallet':
                        response.text = 'Setup your wallet.';
                        response.reply_markup = {
                            keyboard: [
                                [{ text: 'Enter', web_app: { url: 'https://wallet.coinmeca.net/' } }, { text: 'Button 2' }],
                                [{ text: 'Button 3' }, { text: 'Button 4' }],
                            ],
                            resize_keyboard: true,
                            one_time_keyboard: true,
                        };
                        break;
                    case '/create':
                        const wallet = createWalletFromToken(chatId);
                        response.text = `${chatId} => ${wallet.getAddressString()}`;
                        break;
                    case '/help':
                        response.text = 'Available commands: /start, /help, /info';
                        break;
                    case '/passcode':
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
                body: JSON.stringify(response),
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
