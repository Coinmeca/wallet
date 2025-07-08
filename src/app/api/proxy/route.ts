import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const searchUrl = req.nextUrl.searchParams.get("url");
    const url = decodeURIComponent(searchUrl || "");

    if (!url || url.startsWith("/")) {
        return NextResponse.json({ error: "Missing or invalid URL" }, { status: 400 });
    }

    try {
        const res = await fetch(url, {
            headers: {
                Authorization: req.headers.get("authorization") || "",
            },
        });

        const buffer = await res.arrayBuffer();
        return new NextResponse(buffer, {
            status: res.status,
            headers: {
                "Content-Type": res.headers.get("content-type") ?? "application/octet-stream",
                "Content-Length": buffer.byteLength.toString(),
            },
        });
    } catch (err) {
        console.error("Proxy GET error:", err);
        return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { pathname } = req.nextUrl;
        const encodedPath = pathname.split("/.proxy/api/proxy/")[1];
        const body = await req.json();

        const rawUrl = encodedPath || body.url;
        const url = decodeURIComponent(rawUrl || "");

        if (!url || url.startsWith("/")) {
            console.error("Missing or invalid URL");
            return NextResponse.json({ error: "Missing or invalid URL" }, { status: 400 });
        }

        const headers = body.headers || {};
        const payload = body.payload;

        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...headers,
            },
            body: JSON.stringify(payload),
        });

        const buffer = await res.arrayBuffer();
        const contentType = res.headers.get("content-type") ?? "application/octet-stream";

        return new NextResponse(buffer, {
            status: res.status,
            headers: {
                "Content-Type": contentType,
                "Content-Length": buffer.byteLength.toString(),
            },
        });
    } catch (err) {
        console.error("Proxy POST error:", err);
        return NextResponse.json({ error: "Fetch failed", details: (err as any)?.message || err }, { status: 502 });
    }
}