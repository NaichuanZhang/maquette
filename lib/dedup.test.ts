import { describe, it, expect } from "vitest";
import { countUniqueScansSince } from "./dedup";

describe("countUniqueScansSince", () => {
  const NOW = new Date("2026-05-04T12:00:00Z");

  it("returns 0 when there are no scans", () => {
    expect(countUniqueScansSince([], 24, NOW)).toBe(0);
  });

  it("dedupes the same (ip_hash, ua_hash) pair inside the window", () => {
    const scans = [
      { scanned_at: "2026-05-04T10:00:00Z", ip_hash: "a", ua_hash: "u1" },
      { scanned_at: "2026-05-04T10:05:00Z", ip_hash: "a", ua_hash: "u1" },
      { scanned_at: "2026-05-04T11:00:00Z", ip_hash: "a", ua_hash: "u1" },
    ];
    expect(countUniqueScansSince(scans, 24, NOW)).toBe(1);
  });

  it("counts distinct pairs separately", () => {
    const scans = [
      { scanned_at: "2026-05-04T10:00:00Z", ip_hash: "a", ua_hash: "u1" },
      { scanned_at: "2026-05-04T10:05:00Z", ip_hash: "b", ua_hash: "u1" },
      { scanned_at: "2026-05-04T10:10:00Z", ip_hash: "a", ua_hash: "u2" },
    ];
    expect(countUniqueScansSince(scans, 24, NOW)).toBe(3);
  });

  it("excludes scans outside the window", () => {
    const scans = [
      { scanned_at: "2026-05-03T11:00:00Z", ip_hash: "a", ua_hash: "u1" },
      { scanned_at: "2026-05-03T12:30:00Z", ip_hash: "a", ua_hash: "u1" },
      { scanned_at: "2026-05-04T11:30:00Z", ip_hash: "a", ua_hash: "u1" },
    ];
    expect(countUniqueScansSince(scans, 24, NOW)).toBe(1);
  });

  it("treats null ip_hash / ua_hash as a stable 'unknown' pair", () => {
    const scans = [
      { scanned_at: "2026-05-04T10:00:00Z", ip_hash: null, ua_hash: null },
      { scanned_at: "2026-05-04T10:01:00Z", ip_hash: null, ua_hash: null },
      { scanned_at: "2026-05-04T10:02:00Z", ip_hash: "a", ua_hash: null },
    ];
    expect(countUniqueScansSince(scans, 24, NOW)).toBe(2);
  });

  it("supports 7-day windows", () => {
    const scans = [
      { scanned_at: "2026-04-28T12:30:00Z", ip_hash: "a", ua_hash: "u1" },
      { scanned_at: "2026-04-20T12:00:00Z", ip_hash: "b", ua_hash: "u1" },
    ];
    expect(countUniqueScansSince(scans, 24 * 7, NOW)).toBe(1);
  });
});
