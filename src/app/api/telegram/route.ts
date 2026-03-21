import { NextRequest, NextResponse } from "next/server";

import { wallet } from "utils/wallet";

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

const json = (error: string, status: number) => NextResponse.json({ error }, { status });

const bot = () => process.env.TELEGRAM_TOKEN;

const chat = (value?: string | number | null) => {
    if (typeof value === "number" && !isNaN(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
        const next = Number(value);
        if (!isNaN(next)) return next;
    }
};

const link = (value: any, req: NextRequest) => {
    if (typeof value !== "string" || value.trim() === "") return wallet("/", req.url);

    try {
        return new URL(value).toString();
    } catch {
        return wallet("/", req.url);
    }
};

const send = async (response: TelegramResponse) => {
    const token = bot();
    if (!token || token === "") throw new Error("Telegram bot token is not configured.");

    const telegramApiUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const result = await fetch(telegramApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(response),
    });

    if (!result.ok) {
        const text = await result.text().catch(() => "");
        throw new Error(text || "Failed to send Telegram message.");
    }
};

const secret = () => process.env.TELEGRAM_SECRET_TOKEN || process.env.TELEGRAM_WEBHOOK_SECRET;

const token = (req: NextRequest) => {
    const header = req.headers.get("x-telegram-bot-api-secret-token");
    if (header && header !== "") return header;

    const auth = req.headers.get("authorization");
    if (auth && auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
};

export async function POST(req: NextRequest) {
    try {
        const value = secret();
        if (!value || value === "") return json("Telegram route secret is not configured.", 503);
        if (!bot()) return json("Telegram bot token is not configured.", 503);
        if (token(req) !== value) return json("Unauthorized", 401);

        const body = await req.json();
        const { chatId, message, callback_query, request } = body;

        const { searchParams } = new URL(req.url);
        const chat_id = chat(chatId || searchParams.get("chat_id"));

        // Define a response template
        let response: TelegramResponse = {
            chat_id: chat(message?.chat?.id || callback_query?.message?.chat?.id || chat_id)!,
            text: "",
        };

        if (request) {
            if (!chat_id) return json("Bad Request: Missing chat_id for wallet handoff", 400);
            if (typeof request !== "object" || !request?.id || request?.id === "") return json("Bad Request: Invalid wallet handoff request", 400);
            response.text = "Open Coinmeca Wallet";
            response.chat_id = chat_id;
            response.reply_markup = {
                keyboard: [
                    [
                        {
                            text: "Wallet",
                            web_app: {
                                url: link(request?.url, req),
                            },
                        },
                    ],
                ],
                resize_keyboard: true,
            };

            await send(response);
            return NextResponse.json({ message: "OK" });
        }

        if (callback_query && callback_query.data) {
            // Handle data sent from Telegram WebApp using sendData
            const chat_id = callback_query.message.chat.id;
            response = {
                chat_id,
                text: `Received data from WebApp: ${callback_query.data}`,
            };
        } else if (message && message.text) {
            // Handle regular commands as before
            const chat_id = message.chat.id;
            const command = message.text;

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
                                        url: wallet("/", req.url),
                                    },
                                },
                            ],
                        ],
                        resize_keyboard: true,
                    };
                } else if (command === "/help") {
                    response.text = "Available commands: /start, /wallet, /help, /test, /info";
                } else if (command === "/test") {
                    response.text = "Click the button below to open the web app";
                    response.reply_markup = {
                        keyboard: [
                            [
                                {
                                    text: "Open Web App",
                                    web_app: {
                                        url: wallet("/", req.url),
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
                response.text = `You said: ${command}`;
            }
        } else {
            return json("Bad Request: No message or callback_query data found", 400);
        }

        // Send response back to Telegram
        await send(response);
        return NextResponse.json({ message: "OK" });
    } catch (error) {
        console.error("Error handling the request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    return NextResponse.json({ message: "GET request not supported" }, { status: 405 });
}
