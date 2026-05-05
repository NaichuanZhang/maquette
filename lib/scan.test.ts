import { describe, it, expect, vi } from "vitest";
import { buildScanRecord } from "./scan";

const SALT = "test-salt";

function mkHeaders(init: Record<string, string>): Headers {
  return new Headers(init);
}

describe("buildScanRecord", () => {
  it("derives device/os/browser from user-agent and populates geo from Vercel headers", () => {
    const headers = mkHeaders({
      "user-agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
      "x-forwarded-for": "203.0.113.42, 10.0.0.1",
      "x-vercel-ip-country": "US",
      "x-vercel-ip-country-region": "CA",
      "x-vercel-ip-city": "San Francisco",
      "accept-language": "en-US,en;q=0.9",
      referer: "https://example.com/",
    });

    const scan = buildScanRecord({
      headers,
      trackingLinkId: "11111111-2222-3333-4444-555555555555",
      salt: SALT,
    });

    expect(scan.tracking_link_id).toBe("11111111-2222-3333-4444-555555555555");
    expect(scan.device_type).toBe("mobile");
    expect(scan.os).toBe("iOS");
    expect(scan.browser).toMatch(/Safari/);
    expect(scan.country).toBe("US");
    expect(scan.region).toBe("CA");
    expect(scan.city).toBe("San Francisco");
    expect(scan.language).toBe("en-US");
    expect(scan.referrer).toBe("https://example.com/");
    expect(scan.ip_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(scan.ua_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("uses the first IP from x-forwarded-for for hashing", () => {
    const salt = SALT;
    const linkId = "aaa";
    const a = buildScanRecord({
      headers: mkHeaders({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }),
      trackingLinkId: linkId,
      salt,
    });
    const b = buildScanRecord({
      headers: mkHeaders({ "x-forwarded-for": "1.2.3.4" }),
      trackingLinkId: linkId,
      salt,
    });
    expect(a.ip_hash).toBe(b.ip_hash);
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const headers = mkHeaders({ "x-real-ip": "9.9.9.9" });
    const scan = buildScanRecord({
      headers,
      trackingLinkId: "link",
      salt: SALT,
    });
    expect(scan.ip_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("handles missing optional headers gracefully", () => {
    const scan = buildScanRecord({
      headers: mkHeaders({}),
      trackingLinkId: "link",
      salt: SALT,
    });
    expect(scan.device_type).toBe("unknown");
    expect(scan.country).toBeNull();
    expect(scan.region).toBeNull();
    expect(scan.city).toBeNull();
    expect(scan.referrer).toBeNull();
    expect(scan.language).toBeNull();
    expect(scan.user_agent).toBeNull();
  });

  it("classifies Googlebot as 'bot'", () => {
    const scan = buildScanRecord({
      headers: mkHeaders({
        "user-agent":
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      }),
      trackingLinkId: "link",
      salt: SALT,
    });
    expect(scan.device_type).toBe("bot");
  });
});
