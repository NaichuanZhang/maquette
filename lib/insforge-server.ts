import "server-only";
import { cookies } from "next/headers";
import { createClient, type InsForgeClient } from "@insforge/sdk";

export const ACCESS_COOKIE = "insforge_access_token";
export const REFRESH_COOKIE = "insforge_refresh_token";
export const VERIFIER_COOKIE = "insforge_code_verifier";

const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function createServerClient(accessToken?: string): InsForgeClient {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const anonKey =
    process.env.INSFORGE_ANON_KEY ?? process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
  if (!baseUrl || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_INSFORGE_URL or INSFORGE_ANON_KEY",
    );
  }
  return createClient({
    baseUrl,
    anonKey,
    isServerMode: true,
    edgeFunctionToken: accessToken,
  });
}

export function createAdminClient(): InsForgeClient {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const apiKey = process.env.INSFORGE_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_INSFORGE_URL or INSFORGE_API_KEY (server-only)",
    );
  }
  return createClient({
    baseUrl,
    anonKey: apiKey,
    isServerMode: true,
  });
}

export async function setAuthCookies(
  accessToken: string,
  refreshToken?: string | null,
): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_COOKIE, accessToken, {
    ...authCookieOptions,
    maxAge: 60 * 15,
  });
  if (refreshToken) {
    store.set(REFRESH_COOKIE, refreshToken, {
      ...authCookieOptions,
      maxAge: 60 * 60 * 24 * 7,
    });
  }
}

export async function clearAuthCookies(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
  store.delete(VERIFIER_COOKIE);
}

export async function getAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value ?? null;
}

export async function getCurrentUser() {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    const client = createServerClient(token);
    const { data, error } = await client.auth.getCurrentUser();
    if (error || !data?.user) return null;
    return data.user;
  } catch {
    return null;
  }
}
