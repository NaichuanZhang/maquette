import { describe, it, expect } from "vitest";
import { parseUserAgent } from "./ua-parse";

const UA = {
  iphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  androidPhone:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  ipad:
    "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  desktopChrome:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  googlebot:
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
};

describe("parseUserAgent", () => {
  it("identifies an iPhone as mobile + iOS + Safari", () => {
    const r = parseUserAgent(UA.iphone);
    expect(r.device_type).toBe("mobile");
    expect(r.os).toBe("iOS");
    expect(r.browser).toBe("Safari");
  });

  it("identifies an Android phone as mobile + Android + Chrome", () => {
    const r = parseUserAgent(UA.androidPhone);
    expect(r.device_type).toBe("mobile");
    expect(r.os).toBe("Android");
    expect(r.browser).toMatch(/Chrome/);
  });

  it("identifies an iPad as tablet", () => {
    const r = parseUserAgent(UA.ipad);
    expect(r.device_type).toBe("tablet");
    expect(r.os).toBe("iOS");
  });

  it("identifies desktop Chrome on macOS", () => {
    const r = parseUserAgent(UA.desktopChrome);
    expect(r.device_type).toBe("desktop");
    expect(r.os).toMatch(/Mac ?OS/);
    expect(r.browser).toBe("Chrome");
    expect(r.browser_version).toMatch(/^\d+/);
  });

  it("flags Googlebot as a bot", () => {
    const r = parseUserAgent(UA.googlebot);
    expect(r.device_type).toBe("bot");
  });

  it("returns device_type='unknown' for empty or nullish input", () => {
    expect(parseUserAgent("").device_type).toBe("unknown");
    expect(parseUserAgent(null).device_type).toBe("unknown");
    expect(parseUserAgent(undefined).device_type).toBe("unknown");
  });
});
