import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const isDev = process.env.NODE_ENV !== "production";

const isShellRoute = (pathname: string) =>
    pathname === "/lock" ||
    pathname.startsWith("/lock/") ||
    pathname === "/proxy" ||
    pathname.startsWith("/proxy/") ||
    pathname === "/request" ||
    pathname.startsWith("/request/");

const csp = (pathname: string) =>
    [
        "default-src 'self'",
        `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://static.cloudflareinsights.com https://telegram.org`,
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https://web3.coinmeca.net",
        "media-src 'self' https://coinmeca.net",
        `connect-src 'self' https:${isDev ? " http: ws: wss:" : ""} data: blob:`,
        `frame-ancestors ${isShellRoute(pathname) ? "*" : "'none'"}`,
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
    ].join("; ");

export function middleware(request: NextRequest) {
    const response = NextResponse.next();
    response.headers.set("Content-Security-Policy", csp(request.nextUrl.pathname));
    return response;
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sw.js).*)"],
};
