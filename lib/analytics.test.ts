import { describe, it, expect } from "vitest";
import {
  bucketScansByDay,
  bucketScansByHour,
  stackedByPlacement,
  summarizeDevices,
  summarizeCountries,
} from "./analytics";

describe("bucketScansByDay", () => {
  it("returns contiguous daily buckets including days with zero scans", () => {
    const scans = [
      { scanned_at: "2026-05-01T10:00:00Z" },
      { scanned_at: "2026-05-01T12:00:00Z" },
      { scanned_at: "2026-05-03T08:00:00Z" },
    ];
    const buckets = bucketScansByDay(scans, {
      from: "2026-05-01T00:00:00Z",
      to: "2026-05-03T23:59:59Z",
    });
    expect(buckets).toEqual([
      { date: "2026-05-01", count: 2 },
      { date: "2026-05-02", count: 0 },
      { date: "2026-05-03", count: 1 },
    ]);
  });
});

describe("bucketScansByHour", () => {
  it("groups by hour on the same day", () => {
    const buckets = bucketScansByHour(
      [
        { scanned_at: "2026-05-04T09:05:00Z" },
        { scanned_at: "2026-05-04T09:55:00Z" },
        { scanned_at: "2026-05-04T11:00:00Z" },
      ],
      {
        from: "2026-05-04T09:00:00Z",
        to: "2026-05-04T11:00:00Z",
      },
    );
    expect(buckets).toEqual([
      { hour: "2026-05-04T09:00", count: 2 },
      { hour: "2026-05-04T10:00", count: 0 },
      { hour: "2026-05-04T11:00", count: 1 },
    ]);
  });
});

describe("stackedByPlacement", () => {
  it("produces one row per date with a column per placement_type", () => {
    const rows = stackedByPlacement(
      [
        { scanned_at: "2026-05-01T10:00:00Z", tracking_link_id: "A" },
        { scanned_at: "2026-05-01T11:00:00Z", tracking_link_id: "B" },
        { scanned_at: "2026-05-02T11:00:00Z", tracking_link_id: "A" },
      ],
      new Map([
        ["A", "physical"],
        ["B", "digital"],
      ]),
      { from: "2026-05-01T00:00:00Z", to: "2026-05-02T23:59:59Z" },
    );

    expect(rows).toEqual([
      { date: "2026-05-01", physical: 1, digital: 1, print: 0, other: 0 },
      { date: "2026-05-02", physical: 1, digital: 0, print: 0, other: 0 },
    ]);
  });
});

describe("summarizeDevices", () => {
  it("counts per device type with friendly labels", () => {
    const summary = summarizeDevices([
      { device_type: "mobile" },
      { device_type: "mobile" },
      { device_type: "desktop" },
      { device_type: "bot" },
      { device_type: null },
    ]);
    expect(summary).toEqual([
      { label: "Mobile", value: 2 },
      { label: "Desktop", value: 1 },
      { label: "Bot", value: 1 },
      { label: "Unknown", value: 1 },
    ]);
  });
});

describe("summarizeCountries", () => {
  it("sorts countries descending by count", () => {
    const summary = summarizeCountries([
      { country: "US" },
      { country: "US" },
      { country: "CA" },
      { country: null },
    ]);
    expect(summary).toEqual([
      { country: "US", count: 2 },
      { country: "CA", count: 1 },
      { country: "Unknown", count: 1 },
    ]);
  });
});
