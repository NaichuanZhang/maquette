export function appUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv && fromEnv.length > 0) return fromEnv.replace(/\/+$/, "");
  return "http://localhost:3000";
}

export function shortUrl(shortCode: string): string {
  return `${appUrl()}/r/${shortCode}`;
}
