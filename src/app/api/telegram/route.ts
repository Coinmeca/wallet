import { NextRequest, NextResponse } from "next/server";
import fetch from "node-fetch";
import { wallet } from "wallet";

// message of body
// {
//     "message_id": 53,
//     "from": {
//         "id": 2007997487,
//         "is_bot": false,
//         "first_name": "Pepe",
//         "language_code": "en"
//     },
//     "chat": {
//         "id": 2007997487,
//         "first_name": "Pepe",
//         "type": "private"
//     },
//     "date": 1721873701,
//     "text": "/data",
//     "entities": [
//         {
//             "offset": 0,
//             "length": 5,
//             "type": "bot_command"
//         }
//     ]
// }

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

const send = async (response: TelegramResponse) => {
    const telegramApiUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`;
    await fetch(telegramApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(response),
    });
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message } = body;

        if (message && message.text) {
            const chat_id = message.chat.id;
            const command = message.text;

            let response: TelegramResponse = {
                chat_id,
                text: "",
            };

            if (command.startsWith("/")) {
                // Handle commands
                if (command === "/start") {
                    response.text = "Welcome to the bot! Use /help to see available commands.";
                } else if (command === "/wallet") {
                    response.text = "Open Coinmeca Wallet";
                    response.reply_markup = {
                        keyboard: [
                            [
                                {
                                    text: "Wallet",
                                    web_app: {
                                        url: "https://wallet.coinmeca.net",
                                    },
                                },
                            ],
                        ],
                        resize_keyboard: true,
                    };
                } else if (command.startsWith("/create")) {
                    const mnemonic = command?.split(" ");
                    const seed = chat_id + mnemonic[1];
                    const { address } = wallet(seed);

                    response.text = `
                        mnemonic: ${mnemonic.toString()},\n
                        mnemonic length:${mnemonic?.length},\n
                        mnemonic isBlank:${mnemonic[1] ? mnemonic[1] === "" : "none"},\n
                        mnemonic code length:${mnemonic[1] ? mnemonic[1].length : "none"},\n
                        ${chat_id} => ${address}`;
                } else if (command === "/help") {
                    response.text = "Available commands: /start, /help, /info";
                } else if (command === "/data") {
                    response.text = JSON.stringify(message);
                } else if (command === "/test") {
                    response.text = "Click the button below to open the web app";
                    response.reply_markup = {
                        keyboard: [
                            [
                                {
                                    text: "Open Web App",
                                    web_app: {
                                        url: "https://coinmeca.net",
                                    },
                                },
                            ],
                        ],
                        resize_keyboard: true,
                        one_time_keyboard: true,
                    };
                } else if (command === "/info") {
                    response.text = `Your chat ID is ${chat_id}`;
                } else {
                    response.text = "Unknown command. Use /help to see available commands.";
                }
            } else {
                // Handle other messages
                response.text = `You said: ${command}`;
            }

            // Send a response back to the Telegram chat
            await send(response);

            return NextResponse.json({ message: "OK" });
        } else {
            return NextResponse.json({ error: "Bad Request: No message data found" }, { status: 400 });
        }
    } catch (error) {
        console.error("Error handling the request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ message: "GET request not supported" }, { status: 405 });
}
