import { NextRequest, NextResponse } from "next/server";

const timeout = 10000;
const bodyLimit = 1024 * 1024;
const fileLimit = 5 * 1024 * 1024;
const heads = new Set(["accept", "authorization", "content-type"]);
const local = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const allowlist = (process.env.PROXY_ALLOWLIST || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

const json = (error: string, status: number, details?: string) =>
    NextResponse.json(details ? { error, details } : { error }, { status, headers: { "Cache-Control": "no-store" } });

const size = (value?: string) => Buffer.byteLength(value || "", "utf8");

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

const head = (input?: Headers | Record<string, any>) => {
    const output = new Headers();
    if (!input) return output;

    const values = input instanceof Headers ? input.entries() : Object.entries(input);
    for (const [key, value] of values) {
        const name = key.toLowerCase();
        if (!heads.has(name) || value === undefined || value === null || value === "") continue;
        output.set(name, `${value}`);
    }

    return output;
};

const body = (payload: any) => {
    if (typeof payload === "undefined") return;
    const value = JSON.stringify(payload);
    if (size(value) > bodyLimit) throw new Error("Proxy payload too large.");
    return value;
};

const data = async (res: Response) => {
    const length = Number(res.headers.get("content-length") || 0);
    if (length && length > fileLimit) throw new Error("Proxy response too large.");

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > fileLimit) throw new Error("Proxy response too large.");
    return buffer;
};

const call = async (url: URL, init?: RequestInit) => {
    const res = await fetch(url, {
        ...init,
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(timeout),
    });

    const buffer = await data(res);
    return new NextResponse(buffer, {
        status: res.status,
        headers: {
            "Cache-Control": "no-store",
            "Content-Length": buffer.byteLength.toString(),
            "Content-Type": res.headers.get("content-type") ?? "application/octet-stream",
        },
    });
};

const input = async (req: NextRequest) => {
    try {
        return await req.json();
    } catch {
        return;
    }
};

const path = (pathname: string) => {
    const value = ["/.proxy/api/proxy/", "/api/proxy/"].find((prefix) => pathname.startsWith(prefix));
    return value ? pathname.slice(value.length) : undefined;
};

export async function GET(req: NextRequest) {
    const url = target(req.nextUrl.searchParams.get("url"));
    if (!url) {
        console.error("Missing or blocked URL");
        return json("Missing or blocked URL", 400);
    }

    try {
        return await call(url, {
            headers: head(req.headers),
        });
    } catch (err) {
        console.error("Proxy GET error:", err);
        return json("Fetch failed", 502, (err as Error)?.message);
    }
}

export async function POST(req: NextRequest) {
    try {
        const data = await input(req);
        if (!data) return json("Invalid request body", 400);

        const value = path(req.nextUrl.pathname);

        const url = target(value || data?.url);
        if (!url) {
            console.error("Missing or blocked URL");
            return json("Missing or blocked URL", 400);
        }

        const payload = body(data?.payload);
        const headers = head(data?.headers);
        if (payload && !headers.has("content-type")) headers.set("content-type", "application/json");

        return await call(url, {
            method: "POST",
            headers,
            body: payload,
        });
    } catch (err) {
        console.error("Proxy POST error:", err);
        return json("Fetch failed", 502, (err as Error)?.message);
    }
}
