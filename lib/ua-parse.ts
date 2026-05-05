import { UAParser } from "ua-parser-js";

export type DeviceType = "mobile" | "tablet" | "desktop" | "bot" | "unknown";

export interface ParsedUserAgent {
  device_type: DeviceType;
  os: string | null;
  browser: string | null;
  browser_version: string | null;
}

const BOT_PATTERN =
  /bot|crawler|spider|slurp|bingpreview|headlesschrome|lighthouse|pingdom|uptimerobot/i;

export function parseUserAgent(
  ua: string | null | undefined,
): ParsedUserAgent {
  if (!ua || ua.trim() === "") {
    return {
      device_type: "unknown",
      os: null,
      browser: null,
      browser_version: null,
    };
  }

  if (BOT_PATTERN.test(ua)) {
    const parsed = UAParser(ua);
    return {
      device_type: "bot",
      os: parsed.os?.name ?? null,
      browser: parsed.browser?.name ?? null,
      browser_version: parsed.browser?.version ?? null,
    };
  }

  const parsed = UAParser(ua);
  const rawType = parsed.device?.type;
  let device_type: DeviceType;
  if (rawType === "mobile") device_type = "mobile";
  else if (rawType === "tablet") device_type = "tablet";
  else device_type = "desktop";

  return {
    device_type,
    os: parsed.os?.name ?? null,
    browser: parsed.browser?.name ?? null,
    browser_version: parsed.browser?.version ?? null,
  };
}
