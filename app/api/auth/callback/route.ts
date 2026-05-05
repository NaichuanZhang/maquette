import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  createServerClient,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  VERIFIER_COOKIE,
} from "@/lib/insforge-server";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

function loginRedirect(request: NextRequest, error: string) {
  return NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent(error)}`, request.url),
  );
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("insforge_code");
  const providerError = params.get("error");

  if (providerError) return loginRedirect(request, providerError);
  if (!code) return loginRedirect(request, "missing_code");

  const store = await cookies();
  const codeVerifier = store.get(VERIFIER_COOKIE)?.value;
  if (!codeVerifier) return loginRedirect(request, "missing_verifier");

  const client = createServerClient();
  const { data, error } = await client.auth.exchangeOAuthCode(code, codeVerifier);
  if (error || !data?.accessToken) {
    return loginRedirect(request, error?.message ?? "exchange_failed");
  }

  store.delete(VERIFIER_COOKIE);
  store.set(ACCESS_COOKIE, data.accessToken, {
    ...cookieOptions,
    maxAge: 60 * 15,
  });
  if (data.refreshToken) {
    store.set(REFRESH_COOKIE, data.refreshToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
