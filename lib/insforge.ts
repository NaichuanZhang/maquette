import { createClient, type InsForgeClient } from "@insforge/sdk";

let cachedClient: InsForgeClient | null = null;

function readEnv(): { baseUrl: string; anonKey: string } {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY ?? "";
  if (!baseUrl || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_INSFORGE_URL or NEXT_PUBLIC_INSFORGE_ANON_KEY. " +
        "Copy .env.example to .env.local and populate both values.",
    );
  }
  return { baseUrl, anonKey };
}

export function getBrowserClient(): InsForgeClient {
  if (cachedClient) return cachedClient;
  const { baseUrl, anonKey } = readEnv();
  cachedClient = createClient({ baseUrl, anonKey });
  return cachedClient;
}

export function __resetBrowserClientForTests(): void {
  cachedClient = null;
}
