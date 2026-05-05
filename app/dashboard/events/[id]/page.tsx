import { notFound } from "next/navigation";
import { getEventWithLinks } from "./actions";
import {
  getAccessToken,
  createServerClient,
} from "@/lib/insforge-server";
import { shortUrl } from "@/lib/urls";
import { InlineCreateLink } from "./InlineCreateLink";
import { LinkRow } from "./LinkRow";
import { StackedArea } from "@/components/charts/StackedArea";
import { stackedByPlacement } from "@/lib/analytics";
import type { PlacementType } from "@/lib/tracking-links";

export const dynamic = "force-dynamic";

async function loadScanRows(
  linkIds: string[],
): Promise<Array<{ tracking_link_id: string; scanned_at: string }>> {
  if (linkIds.length === 0) return [];
  const token = await getAccessToken();
  if (!token) return [];
  const client = createServerClient(token);

  const { data } = await client.database
    .from("scans")
    .select("tracking_link_id, scanned_at")
    .in("tracking_link_id", linkIds)
    .order("scanned_at", { ascending: true });

  return (data ?? []) as Array<{
    tracking_link_id: string;
    scanned_at: string;
  }>;
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getEventWithLinks(id);
  if (!result) notFound();
  const { event, links } = result;

  const scans = await loadScanRows(links.map((l) => l.id));

  const counts: Record<string, number> = {};
  const lastScan: Record<string, string> = {};
  for (const row of scans) {
    counts[row.tracking_link_id] = (counts[row.tracking_link_id] ?? 0) + 1;
    const prev = lastScan[row.tracking_link_id];
    if (!prev || row.scanned_at > prev) {
      lastScan[row.tracking_link_id] = row.scanned_at;
    }
  }
  const totalScans = scans.length;

  const now = new Date();
  const thirtyAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const linkTypes = new Map<string, PlacementType>(
    links.map((l) => [l.id, l.placement_type]),
  );
  const stackedRows = stackedByPlacement(scans, linkTypes, {
    from: thirtyAgo.toISOString(),
    to: now.toISOString(),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{event.name}</h1>
          <a
            href={event.luma_url}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-sm text-muted-foreground underline"
          >
            {event.luma_url}
          </a>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold tabular-nums">
            {totalScans}
          </div>
          <div className="text-xs text-muted-foreground">total scans</div>
        </div>
      </div>

      {totalScans > 0 ? (
        <section className="space-y-2 rounded-lg border border-border p-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Scans — last 30 days, by placement type
          </h2>
          <StackedArea rows={stackedRows} />
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Tracking links
        </h2>
        <InlineCreateLink eventId={event.id} />

        {links.length === 0 ? (
          <div className="rounded-md border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            Add your first placement above.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Label / code</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Scans</th>
                  <th className="px-4 py-2">Last scan</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <LinkRow
                    key={link.id}
                    link={link}
                    shortUrl={shortUrl(link.short_code)}
                    scanCount={counts[link.id] ?? 0}
                    lastScanAt={lastScan[link.id] ?? null}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
