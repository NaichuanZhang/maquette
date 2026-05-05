import type { PlacementType } from "./tracking-links";
import { PLACEMENT_TYPES } from "./tracking-links";
import type { DeviceType } from "./ua-parse";

function toDayKey(iso: string): string {
  return iso.slice(0, 10);
}

function toHourKey(iso: string): string {
  return iso.slice(0, 13) + ":00";
}

function* eachDay(from: Date, to: Date): Generator<string> {
  const cursor = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()),
  );
  const end = new Date(
    Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()),
  );
  while (cursor <= end) {
    yield cursor.toISOString().slice(0, 10);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
}

function* eachHour(from: Date, to: Date): Generator<string> {
  const cursor = new Date(
    Date.UTC(
      from.getUTCFullYear(),
      from.getUTCMonth(),
      from.getUTCDate(),
      from.getUTCHours(),
    ),
  );
  const end = new Date(
    Date.UTC(
      to.getUTCFullYear(),
      to.getUTCMonth(),
      to.getUTCDate(),
      to.getUTCHours(),
    ),
  );
  while (cursor <= end) {
    yield cursor.toISOString().slice(0, 13) + ":00";
    cursor.setUTCHours(cursor.getUTCHours() + 1);
  }
}

export interface DayBucket {
  date: string;
  count: number;
}

export interface HourBucket {
  hour: string;
  count: number;
}

export interface Range {
  from: string;
  to: string;
}

export function bucketScansByDay(
  scans: Array<{ scanned_at: string }>,
  range: Range,
): DayBucket[] {
  const counts = new Map<string, number>();
  for (const scan of scans) {
    const day = toDayKey(scan.scanned_at);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  const result: DayBucket[] = [];
  for (const date of eachDay(new Date(range.from), new Date(range.to))) {
    result.push({ date, count: counts.get(date) ?? 0 });
  }
  return result;
}

export function bucketScansByHour(
  scans: Array<{ scanned_at: string }>,
  range: Range,
): HourBucket[] {
  const counts = new Map<string, number>();
  for (const scan of scans) {
    const hour = toHourKey(scan.scanned_at);
    counts.set(hour, (counts.get(hour) ?? 0) + 1);
  }
  const result: HourBucket[] = [];
  for (const hour of eachHour(new Date(range.from), new Date(range.to))) {
    result.push({ hour, count: counts.get(hour) ?? 0 });
  }
  return result;
}

export type StackedRow = { date: string } & Record<PlacementType, number>;

export function stackedByPlacement(
  scans: Array<{ scanned_at: string; tracking_link_id: string }>,
  linkTypes: Map<string, PlacementType>,
  range: Range,
): StackedRow[] {
  const byDay = new Map<string, Record<PlacementType, number>>();
  for (const date of eachDay(new Date(range.from), new Date(range.to))) {
    byDay.set(
      date,
      Object.fromEntries(
        PLACEMENT_TYPES.map((pt) => [pt, 0]),
      ) as Record<PlacementType, number>,
    );
  }
  for (const scan of scans) {
    const day = toDayKey(scan.scanned_at);
    const type = linkTypes.get(scan.tracking_link_id);
    if (!type) continue;
    const row = byDay.get(day);
    if (!row) continue;
    row[type] += 1;
  }
  return Array.from(byDay.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, row]) => ({ date, ...row }));
}

const DEVICE_LABELS: Record<DeviceType | "null", string> = {
  mobile: "Mobile",
  tablet: "Tablet",
  desktop: "Desktop",
  bot: "Bot",
  unknown: "Unknown",
  null: "Unknown",
};

const DEVICE_ORDER: Array<keyof typeof DEVICE_LABELS> = [
  "mobile",
  "desktop",
  "tablet",
  "bot",
  "unknown",
];

export function summarizeDevices(
  scans: Array<{ device_type: DeviceType | null | undefined }>,
): Array<{ label: string; value: number }> {
  const counts = new Map<string, number>();
  for (const scan of scans) {
    const key = scan.device_type ?? "unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return DEVICE_ORDER.flatMap((key) => {
    const value = counts.get(key);
    if (!value) return [];
    return [{ label: DEVICE_LABELS[key], value }];
  });
}

export function summarizeCountries(
  scans: Array<{ country: string | null | undefined }>,
): Array<{ country: string; count: number }> {
  const counts = new Map<string, number>();
  for (const scan of scans) {
    const key = scan.country ?? "Unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country));
}
