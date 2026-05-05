import { notFound } from "next/navigation";
import { getEventWithLinks } from "./actions";
import {
  getAccessToken,
  createServerClient,
} from "@/lib/insforge-server";
import { shortUrl } from "@/lib/urls";
import { InlineCreateLink } from "./InlineCreateLink";
import { LinkRow } from "./LinkRow";

export const dynamic = "force-dynamic";

async function loadScanStats(linkIds: string[]): Promise<{
  counts: Record<string, number>;
  lastScan: Record<string, string>;
}> {
  if (linkIds.length === 0) return { counts: {}, lastScan: {} };
  const token = await getAccessToken();
  if (!token) return { counts: {}, lastScan: {} };
  const client = createServerClient(token);

  const { data } = await client.database
    .from("scans")
    .select("tracking_link_id, scanned_at")
    .in("tracking_link_id", linkIds);

  const rows = (data ?? []) as Array<{
    tracking_link_id: string;
    scanned_at: string;
  }>;

  const counts: Record<string, number> = {};
  const lastScan: Record<string, string> = {};
  for (const row of rows) {
    counts[row.tracking_link_id] = (counts[row.tracking_link_id] ?? 0) + 1;
    const prev = lastScan[row.tracking_link_id];
    if (!prev || row.scanned_at > prev) {
      lastScan[row.tracking_link_id] = row.scanned_at;
    }
  }
  return { counts, lastScan };
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

  const stats = await loadScanStats(links.map((l) => l.id));

  const totalScans = Object.values(stats.counts).reduce(
    (acc, n) => acc + n,
    0,
  );

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
                    scanCount={stats.counts[link.id] ?? 0}
                    lastScanAt={stats.lastScan[link.id] ?? null}
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
