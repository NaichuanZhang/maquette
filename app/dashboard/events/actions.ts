"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createServerClient,
  getAccessToken,
  getCurrentUser,
} from "@/lib/insforge-server";
import { parseEventInput, type EventRow } from "@/lib/events";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const token = await getAccessToken();
  if (!token) redirect("/login");
  return { user, token };
}

export type CreateEventResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createEventAction(
  formData: FormData,
): Promise<CreateEventResult> {
  const { user, token } = await requireUser();

  const parsed = parseEventInput({
    name: String(formData.get("name") ?? ""),
    luma_url: String(formData.get("luma_url") ?? ""),
  });
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const client = createServerClient(token);
  const { data, error } = await client.database
    .from("events")
    .insert([{ ...parsed.value, user_id: user.id }])
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create event." };
  }

  revalidatePath("/dashboard");
  return { ok: true, id: (data as { id: string }).id };
}

export async function archiveEventAction(eventId: string): Promise<void> {
  const { token } = await requireUser();
  const client = createServerClient(token);
  await client.database
    .from("events")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", eventId);
  revalidatePath("/dashboard");
}

export async function listEvents(): Promise<
  Array<EventRow & { scan_count: number }>
> {
  const token = await getAccessToken();
  if (!token) return [];

  const client = createServerClient(token);
  const { data, error } = await client.database
    .from("events")
    .select("*")
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  const events = data as EventRow[];
  if (events.length === 0) return [];

  const eventIds = events.map((e) => e.id);

  const { data: linksRaw } = await client.database
    .from("tracking_links")
    .select("id,event_id")
    .in("event_id", eventIds);
  const links = (linksRaw ?? []) as Array<{ id: string; event_id: string }>;

  const linkToEvent = new Map<string, string>();
  for (const link of links) linkToEvent.set(link.id, link.event_id);

  const counts = new Map<string, number>();
  if (links.length > 0) {
    const linkIds = links.map((l) => l.id);
    const { data: scansRaw } = await client.database
      .from("scans")
      .select("tracking_link_id")
      .in("tracking_link_id", linkIds);
    const scans = (scansRaw ?? []) as Array<{ tracking_link_id: string }>;
    for (const scan of scans) {
      const eventId = linkToEvent.get(scan.tracking_link_id);
      if (!eventId) continue;
      counts.set(eventId, (counts.get(eventId) ?? 0) + 1);
    }
  }

  return events.map((e) => ({ ...e, scan_count: counts.get(e.id) ?? 0 }));
}
