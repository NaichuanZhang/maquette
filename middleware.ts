import { NextRequest, NextResponse } from "next/server";

const ACCESS_COOKIE = "insforge_access_token";

export function middleware(request: NextRequest) {
  const hasToken = Boolean(request.cookies.get(ACCESS_COOKIE)?.value);
  if (!hasToken) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
