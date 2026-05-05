"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createServerClient,
  setAuthCookies,
  clearAuthCookies,
  VERIFIER_COOKIE,
} from "@/lib/insforge-server";

export type AuthResult = { ok: true } | { ok: false; error: string };

export async function signInAction(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { ok: false, error: "Email and password are required." };

  const client = createServerClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data?.accessToken) {
    return { ok: false, error: error?.message ?? "Sign in failed." };
  }
  await setAuthCookies(data.accessToken, data.refreshToken);
  return { ok: true };
}

export async function signUpAction(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim() || undefined;
  if (!email || !password) return { ok: false, error: "Email and password are required." };

  const client = createServerClient();
  const { data, error } = await client.auth.signUp({ email, password, name });
  if (error) return { ok: false, error: error.message };
  if (data?.accessToken) {
    await setAuthCookies(data.accessToken, data.refreshToken);
    return { ok: true };
  }
  return { ok: false, error: "Check your email to verify your account, then sign in." };
}

export async function signOutAction(): Promise<void> {
  await clearAuthCookies();
  redirect("/login");
}

export async function initiateOAuthAction(provider: "google"): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const client = createServerClient();
  const { data, error } = await client.auth.signInWithOAuth({
    provider,
    redirectTo: new URL("/api/auth/callback", appUrl).toString(),
    skipBrowserRedirect: true,
  });

  if (error || !data?.url || !data?.codeVerifier) {
    redirect(
      `/login?error=${encodeURIComponent(error?.message ?? "oauth_init_failed")}`,
    );
  }

  const store = await cookies();
  store.set(VERIFIER_COOKIE, data.codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  redirect(data.url);
}
