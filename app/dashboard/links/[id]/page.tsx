import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createServerClient,
  getAccessToken,
  getCurrentUser,
} from "@/lib/insforge-server";
import { QRPreview } from "@/components/qr-code";
import { TimeSeries } from "@/components/charts/TimeSeries";
import { DeviceBar } from "@/components/charts/DeviceBar";
import {
  bucketScansByDay,
  summarizeCountries,
  summarizeDevices,
} from "@/lib/analytics";
import { shortUrl } from "@/lib/urls";
import type { TrackingLinkRow } from "@/lib/tracking-links";
import type { DeviceType } from "@/lib/ua-parse";

export const dynamic = "force-dynamic";

type ScanRow = {
  id: number;
  scanned_at: string;
  device_type: DeviceType | null;
  os: string | null;
  browser: string | null;
  browser_version: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  ip_hash: string | null;
  ua_hash: string | null;
  referrer: string | null;
};

async function loadLinkDetail(linkId: string): Promise<{
  link: TrackingLinkRow;
  eventName: string;
  scans: ScanRow[];
} | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const token = await getAccessToken();
  if (!token) return null;
  const client = createServerClient(token);

  const { data: linkData } = await client.database
    .from("tracking_links")
    .select("*")
    .eq("id", linkId)
    .maybeSingle();
  if (!linkData) return null;
  const link = linkData as TrackingLinkRow;

  const { data: eventData } = await client.database
    .from("events")
    .select("id, name")
    .eq("id", link.event_id)
    .maybeSingle();
  const eventName = (eventData as { name?: string } | null)?.name ?? "Event";

  const { data: scansData } = await client.database
    .from("scans")
    .select(
      "id, scanned_at, device_type, os, browser, browser_version, country, region, city, ip_hash, ua_hash, referrer",
    )
    .eq("tracking_link_id", linkId)
    .order("scanned_at", { ascending: false })
    .limit(100);

  return {
    link,
    eventName,
    scans: (scansData ?? []) as ScanRow[],
  };
}

export default async function LinkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await loadLinkDetail(id);
  if (!detail) notFound();
  const { link, eventName, scans } = detail;

  const total = scans.length;

  const dayRange = {
    from: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    to: new Date().toISOString(),
  };
  const daily = bucketScansByDay(
    scans.map((s) => ({ scanned_at: s.scanned_at })),
    dayRange,
  );

  const last24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const scansInWindow = scans.filter((s) => s.scanned_at >= last24);
  const unique24 = new Set(
    scansInWindow.map((s) => `${s.ip_hash ?? ""}|${s.ua_hash ?? ""}`),
  ).size;

  const devices = summarizeDevices(scans);
  const countries = summarizeCountries(scans);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href={`/dashboard/events/${link.event_id}`}
          className="text-sm text-muted-foreground underline-offset-2 hover:underline"
        >
          ← {eventName}
        </Link>
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            {link.label}
          </h1>
          <div className="flex items-baseline gap-6 text-right">
            <div>
              <div className="text-3xl font-semibold tabular-nums">
                {total}
              </div>
              <div className="text-xs text-muted-foreground">scans</div>
            </div>
            <div>
              <div className="text-2xl font-semibold tabular-nums">
                {unique24}
              </div>
              <div className="text-xs text-muted-foreground">unique (24h)</div>
            </div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="capitalize">{link.placement_type}</span> ·{" "}
          <span className="font-mono">{link.short_code}</span>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center gap-2">
          <QRPreview
            value={shortUrl(link.short_code)}
            shortCode={link.short_code}
          />
          <code className="max-w-[220px] truncate text-xs text-muted-foreground">
            {shortUrl(link.short_code)}
          </code>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Scans — last 14 days
          </h2>
          <TimeSeries
            rows={daily.map((d) => ({ date: d.date, count: d.count }))}
            xKey="date"
            xLabel={(d) => d.slice(5)}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-border p-4 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Devices
          </h2>
          <DeviceBar rows={devices} />
        </div>
        <div className="rounded-lg border border-border p-4 space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Countries
          </h2>
          {countries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No geo data yet.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {countries.slice(0, 8).map((c) => (
                <li key={c.country} className="flex justify-between">
                  <span>{c.country}</span>
                  <span className="font-mono tabular-nums text-muted-foreground">
                    {c.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-border">
        <h2 className="border-b border-border px-4 py-3 text-sm font-medium text-muted-foreground">
          Recent scans ({scans.length > 100 ? "latest 100" : scans.length})
        </h2>
        {scans.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No scans yet. Share the short URL or print the QR.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">When</th>
                  <th className="px-4 py-2">Device</th>
                  <th className="px-4 py-2">OS</th>
                  <th className="px-4 py-2">Browser</th>
                  <th className="px-4 py-2">Location</th>
                </tr>
              </thead>
              <tbody>
                {scans.map((scan) => (
                  <tr key={scan.id} className="border-t border-border">
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {new Date(scan.scanned_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 capitalize">
                      {scan.device_type ?? "—"}
                    </td>
                    <td className="px-4 py-2">{scan.os ?? "—"}</td>
                    <td className="px-4 py-2">
                      {scan.browser ?? "—"}
                      {scan.browser_version
                        ? ` ${scan.browser_version.split(".")[0]}`
                        : ""}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {[scan.city, scan.region, scan.country]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
