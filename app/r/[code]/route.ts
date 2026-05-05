import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/insforge-server";
import { buildScanRecord } from "@/lib/scan";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function notFound() {
  return new NextResponse("Not found", { status: 404 });
}

function salt(): string {
  const s = process.env.IP_HASH_SALT;
  if (!s) throw new Error("IP_HASH_SALT is not set");
  return s;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  if (!code || !/^[0-9A-Za-z]{6,12}$/.test(code)) return notFound();

  const admin = createAdminClient();

  const { data: linkData, error: linkError } = await admin.database
    .from("tracking_links")
    .select("id, event_id, archived_at")
    .eq("short_code", code)
    .maybeSingle();

  const link = linkData as
    | { id: string; event_id: string; archived_at: string | null }
    | null;

  if (linkError || !link || link.archived_at) return notFound();

  const { data: eventData } = await admin.database
    .from("events")
    .select("luma_url, archived_at")
    .eq("id", link.event_id)
    .maybeSingle();

  const event = eventData as
    | { luma_url: string; archived_at: string | null }
    | null;

  if (!event || event.archived_at) return notFound();

  const scan = buildScanRecord({
    headers: request.headers,
    trackingLinkId: link.id,
    salt: salt(),
  });

  const { error: scanError } = await admin.database
    .from("scans")
    .insert([scan]);
  if (scanError) {
    // Surface logging failures — a 302 over a silently-broken logger is
    // worse than an alert, because the dashboard looks empty for no reason.
    console.error("scan insert failed", {
      short_code: code,
      message: scanError.message,
    });
  }

  return NextResponse.redirect(event.luma_url, 302);
}
