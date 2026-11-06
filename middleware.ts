import { NextResponse } from "next/server";

export async function middleware(request: Request) {
  const { pathname } = new URL(request.url);

  if (pathname.startsWith("/api/")) {
    const headers = new Headers(request.headers);
    headers.set("x-frame-options", "DENY");
    headers.set("x-content-type-options", "nosniff");
    headers.set("referrer-policy", "strict-origin-when-cross-origin");

    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
