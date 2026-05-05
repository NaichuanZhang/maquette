export interface EventInput {
  name: string;
  luma_url: string;
}

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function parseEventInput(raw: {
  name?: string | null;
  luma_url?: string | null;
}): ParseResult<EventInput> {
  const name = (raw.name ?? "").trim();
  const url = (raw.luma_url ?? "").trim();

  if (!name) return { ok: false, error: "Event name is required." };
  if (!url) return { ok: false, error: "A destination URL is required." };

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { ok: false, error: "URL must start with http or https." };
    }
  } catch {
    return { ok: false, error: "URL must be a valid http(s) link." };
  }

  return { ok: true, value: { name, luma_url: url } };
}

export interface EventRow {
  id: string;
  user_id: string;
  name: string;
  luma_url: string;
  created_at: string;
  archived_at: string | null;
}
