import type { ParseResult } from "./events";

export const PLACEMENT_TYPES = ["physical", "digital", "print", "other"] as const;
export type PlacementType = (typeof PLACEMENT_TYPES)[number];

function isPlacementType(value: unknown): value is PlacementType {
  return (
    typeof value === "string" &&
    (PLACEMENT_TYPES as readonly string[]).includes(value)
  );
}

export interface CreateLinkInput {
  label: string;
  placement_type: PlacementType;
  notes: string | null;
  metadata: Record<string, unknown>;
}

export interface UpdateLinkInput {
  label?: string;
  placement_type?: PlacementType;
  notes?: string | null;
  metadata?: Record<string, unknown>;
}

export interface TrackingLinkRow {
  id: string;
  event_id: string;
  short_code: string;
  label: string;
  placement_type: PlacementType;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  archived_at: string | null;
}

export function parseCreateLinkInput(raw: {
  label?: string | null;
  placement_type?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
}): ParseResult<CreateLinkInput> {
  const label = (raw.label ?? "").trim();
  if (!label) return { ok: false, error: "Label is required." };

  let placement_type: PlacementType = "other";
  if (raw.placement_type != null && raw.placement_type !== "") {
    if (!isPlacementType(raw.placement_type)) {
      return {
        ok: false,
        error: `placement_type must be one of ${PLACEMENT_TYPES.join(", ")}`,
      };
    }
    placement_type = raw.placement_type;
  }

  const notesTrimmed = raw.notes == null ? null : String(raw.notes).trim();
  const notes = notesTrimmed ? notesTrimmed : null;

  const metadata = raw.metadata && typeof raw.metadata === "object" ? raw.metadata : {};

  return { ok: true, value: { label, placement_type, notes, metadata } };
}

export function parseUpdateLinkInput(raw: {
  label?: string | null;
  placement_type?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
}): ParseResult<UpdateLinkInput> {
  const patch: UpdateLinkInput = {};

  if (raw.label !== undefined) {
    const label = (raw.label ?? "").trim();
    if (!label) return { ok: false, error: "Label cannot be empty." };
    patch.label = label;
  }

  if (raw.placement_type !== undefined && raw.placement_type !== null) {
    if (!isPlacementType(raw.placement_type)) {
      return {
        ok: false,
        error: `placement_type must be one of ${PLACEMENT_TYPES.join(", ")}`,
      };
    }
    patch.placement_type = raw.placement_type;
  }

  if (raw.notes !== undefined) {
    const trimmed = raw.notes == null ? "" : String(raw.notes).trim();
    patch.notes = trimmed ? trimmed : null;
  }

  if (raw.metadata !== undefined && raw.metadata !== null) {
    if (typeof raw.metadata !== "object") {
      return { ok: false, error: "metadata must be an object." };
    }
    patch.metadata = raw.metadata;
  }

  return { ok: true, value: patch };
}
