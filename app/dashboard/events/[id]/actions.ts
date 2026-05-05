"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createAdminClient,
  createServerClient,
  getAccessToken,
  getCurrentUser,
} from "@/lib/insforge-server";
import { mintUniqueShortCode } from "@/lib/short-code";
import {
  parseCreateLinkInput,
  parseUpdateLinkInput,
  type TrackingLinkRow,
} from "@/lib/tracking-links";
import type { EventRow } from "@/lib/events";

async function requireAuthedClient() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const token = await getAccessToken();
  if (!token) redirect("/login");
  return { user, client: createServerClient(token) };
}

export async function getEventWithLinks(eventId: string): Promise<{
  event: EventRow;
  links: TrackingLinkRow[];
} | null> {
  const { client } = await requireAuthedClient();
  const { data: eventData, error } = await client.database
    .from("events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();
  if (error || !eventData) return null;
  const event = eventData as EventRow;

  const { data: linksData } = await client.database
    .from("tracking_links")
    .select("*")
    .eq("event_id", eventId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  const links = (linksData ?? []) as TrackingLinkRow[];
  return { event, links };
}

export async function createTrackingLinkAction(
  eventId: string,
  formData: FormData,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { client } = await requireAuthedClient();

  const parsed = parseCreateLinkInput({
    label: String(formData.get("label") ?? ""),
    placement_type: (formData.get("placement_type") as string | null) ?? undefined,
    notes: (formData.get("notes") as string | null) ?? undefined,
  });
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const admin = createAdminClient();
  const shortCode = await mintUniqueShortCode(async (candidate) => {
    const { data } = await admin.database
      .from("tracking_links")
      .select("id")
      .eq("short_code", candidate)
      .maybeSingle();
    return !!data;
  });

  const { data, error } = await client.database
    .from("tracking_links")
    .insert([
      {
        event_id: eventId,
        short_code: shortCode,
        label: parsed.value.label,
        placement_type: parsed.value.placement_type,
        notes: parsed.value.notes,
        metadata: parsed.value.metadata,
      },
    ])
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create link." };
  }

  revalidatePath(`/dashboard/events/${eventId}`);
  return { ok: true, id: (data as { id: string }).id };
}

export async function updateTrackingLinkAction(
  linkId: string,
  eventId: string,
  patch: {
    label?: string;
    placement_type?: string;
    notes?: string | null;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { client } = await requireAuthedClient();

  const parsed = parseUpdateLinkInput(patch);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  if (Object.keys(parsed.value).length === 0) return { ok: true };

  const { error } = await client.database
    .from("tracking_links")
    .update(parsed.value)
    .eq("id", linkId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/dashboard/events/${eventId}`);
  return { ok: true };
}

export async function archiveTrackingLinkAction(
  linkId: string,
  eventId: string,
): Promise<void> {
  const { client } = await requireAuthedClient();
  await client.database
    .from("tracking_links")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", linkId);
  revalidatePath(`/dashboard/events/${eventId}`);
}
