import { NextRequest, NextResponse } from "next/server";

const host = "https://chainlist.org/api/";

const json = (error: string, status: number) => {
    return NextResponse.json(
        { error },
        {
            status,
            headers: {
                "Cache-Control": "no-store",
            },
        },
    );
};

const path = (pathname: string) => {
    return pathname
        .replace(/^\/api\/chains\/?/i, "")
        .replace(/^\/api\/chainlist\/?/i, "")
        .replace(/^\/+/, "");
};

const target = (req: NextRequest) => {
    const value = path(req.nextUrl.pathname);
    if (!value) return;

    const url = new URL(value, host);
    if (url.origin !== new URL(host).origin) return;

    req.nextUrl.searchParams.forEach((item, key) => {
        url.searchParams.append(key, item);
    });

    return url;
};

const handler = async (req: NextRequest) => {
    try {
        const url = target(req);
        if (!url) return json("Invalid chainlist path", 400);

        const response = await fetch(url.toString(), {
            headers: {
                accept: "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) return json("Failed to fetch chainlist data", response.status);

        return NextResponse.json(await response.json(), {
            headers: {
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("Error fetching data:", error);
        return json("Failed to fetch chainlist data", 500);
    }
};

export const GET = handler;
export const POST = handler;
