"use server";

import { NextRequest, NextResponse } from "next/server";

const timeout = 10000;
const fileLimit = 5 * 1024 * 1024;
const local = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const allowlist = (process.env.IMAGE_PROXY_ALLOWLIST || process.env.PROXY_ALLOWLIST || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

const json = (error: string, status: number, details?: string) =>
    NextResponse.json(details ? { error, details } : { error }, { status, headers: { "Cache-Control": "no-store" } });

const localHost = (host: string) => local.has(host.toLowerCase());

const privateHost = (host: string) => {
    host = host.toLowerCase();
    if (localHost(host)) return true;
    if (/^10\./.test(host)) return true;
    if (/^127\./.test(host)) return true;
    if (/^169\.254\./.test(host)) return true;
    if (/^192\.168\./.test(host)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
    if (/^\[?::1\]?$/.test(host)) return true;
    if (/^\[?(fc|fd)[0-9a-f:]+\]?$/i.test(host)) return true;
    return false;
};

const match = (url: URL) => {
    const host = url.hostname.toLowerCase();
    const origin = url.origin.toLowerCase();

    return allowlist.some((value) => {
        if (value === origin || value === host) return true;
        if (value.startsWith(".")) return host === value.slice(1) || host.endsWith(value);
        return false;
    });
};

const target = (raw?: string | null) => {
    const value = decodeURIComponent(raw || "").trim();
    if (!value || value.startsWith("/")) return;

    try {
        const url = new URL(value);
        const protocol = url.protocol.toLowerCase();
        const host = url.hostname.toLowerCase();

        if (!["https:", "http:"].includes(protocol)) return;
        if (url.username || url.password) return;
        if (privateHost(host) && !(process.env.NODE_ENV !== "production" && localHost(host))) return;
        if (allowlist.length && !match(url)) return;
        if (!allowlist.length && process.env.NODE_ENV === "production") return;

        return url;
    } catch {
        return;
    }
};

const data = async (res: Response) => {
    const length = Number(res.headers.get("content-length") || 0);
    if (length && length > fileLimit) throw new Error("Image response too large.");

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > fileLimit) throw new Error("Image response too large.");
    return buffer;
};

const body = async (req: NextRequest) => {
    try {
        return await req.json();
    } catch {
        return;
    }
};

export async function POST(req: NextRequest) {
    try {
        const payload = await body(req);
        if (!payload) return json("Invalid request body", 400);

        const { url } = payload;
        const input = target(url);

        if (!input) return json("Missing or blocked URL", 400);

        const response = await fetch(input, {
            method: "GET",
            redirect: "error",
            cache: "no-store",
            signal: AbortSignal.timeout(timeout),
        });

        if (!response.ok) return json("Error fetching image", 502);

        const type = response.headers.get("content-type") || "";
        if (!type.toLowerCase().startsWith("image/")) return json("Blocked content type", 415);

        const image = await data(response);
        return new NextResponse(new Uint8Array(image), {
            status: response.status,
            headers: {
                "Cache-Control": "no-store",
                "Content-Length": image.byteLength.toString(),
                "Content-Type": type,
            },
        });
    } catch (error) {
        return json("Error fetching image", 502, (error as Error)?.message);
    }
}
