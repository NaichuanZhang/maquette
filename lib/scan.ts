import { hashWithSalt } from "./hash";
import { parseUserAgent, type DeviceType } from "./ua-parse";

export interface ScanRecord {
  tracking_link_id: string;
  ip_hash: string;
  ua_hash: string;
  user_agent: string | null;
  device_type: DeviceType;
  os: string | null;
  browser: string | null;
  browser_version: string | null;
  language: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  referrer: string | null;
}

function firstIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() ?? "";
}

function primaryLanguage(headers: Headers): string | null {
  const raw = headers.get("accept-language");
  if (!raw) return null;
  const first = raw.split(",")[0]?.trim();
  if (!first) return null;
  return first.split(";")[0]?.trim() || null;
}

function headerOrNull(headers: Headers, name: string): string | null {
  const value = headers.get(name);
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function buildScanRecord(args: {
  headers: Headers;
  trackingLinkId: string;
  salt: string;
}): ScanRecord {
  const { headers, trackingLinkId, salt } = args;

  const userAgent = headerOrNull(headers, "user-agent");
  const ua = parseUserAgent(userAgent);
  const ip = firstIp(headers);

  return {
    tracking_link_id: trackingLinkId,
    ip_hash: hashWithSalt(salt, ip),
    ua_hash: hashWithSalt(salt, userAgent),
    user_agent: userAgent,
    device_type: ua.device_type,
    os: ua.os,
    browser: ua.browser,
    browser_version: ua.browser_version,
    language: primaryLanguage(headers),
    country: headerOrNull(headers, "x-vercel-ip-country"),
    region: headerOrNull(headers, "x-vercel-ip-country-region"),
    city: headerOrNull(headers, "x-vercel-ip-city"),
    referrer: headerOrNull(headers, "referer"),
  };
}
