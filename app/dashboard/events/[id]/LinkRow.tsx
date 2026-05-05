"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Copy, MoreVertical } from "lucide-react";
import type { TrackingLinkRow } from "@/lib/tracking-links";
import {
  updateTrackingLinkAction,
  archiveTrackingLinkAction,
} from "./actions";
import { PLACEMENT_TYPES } from "@/lib/tracking-links";

export function LinkRow({
  link,
  shortUrl,
  scanCount,
  lastScanAt,
}: {
  link: TrackingLinkRow;
  shortUrl: string;
  scanCount: number;
  lastScanAt: string | null;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);

  async function copyShortUrl() {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <>
      <tr className="border-b border-border">
        <td className="px-4 py-3">
          <Link
            href={`/dashboard/links/${link.id}`}
            className="flex flex-col gap-0.5"
          >
            <span className="font-medium">{link.label}</span>
            <span className="text-xs text-muted-foreground font-mono">
              {link.short_code}
            </span>
          </Link>
        </td>
        <td className="px-4 py-3 text-sm capitalize">{link.placement_type}</td>
        <td className="px-4 py-3 text-sm tabular-nums">{scanCount}</td>
        <td className="px-4 py-3 text-xs text-muted-foreground">
          {lastScanAt ? new Date(lastScanAt).toLocaleString() : "—"}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyShortUrl}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2 text-xs hover:bg-accent"
              title="Copy short URL"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-accent"
              title="More"
            >
              <MoreVertical size={14} />
            </button>
          </div>
        </td>
      </tr>
      {editing ? (
        <tr>
          <td colSpan={5} className="bg-muted/40 px-4 py-4">
            <EditForm
              link={link}
              onDone={() => {
                setEditing(false);
                router.refresh();
              }}
            />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function EditForm({
  link,
  onDone,
}: {
  link: TrackingLinkRow;
  onDone: () => void;
}) {
  const [label, setLabel] = useState(link.label);
  const [placementType, setPlacementType] = useState(link.placement_type);
  const [notes, setNotes] = useState(link.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateTrackingLinkAction(link.id, link.event_id, {
        label,
        placement_type: placementType,
        notes,
      });
      if (result.ok) onDone();
      else setError(result.error);
    });
  }

  function archive() {
    if (!confirm("Archive this link? Existing scans stay visible; new scans 404."))
      return;
    startTransition(async () => {
      await archiveTrackingLinkAction(link.id, link.event_id);
      onDone();
    });
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
      <div className="space-y-1">
        <label className="text-xs font-medium">Label</label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="block w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">Placement type</label>
        <select
          value={placementType}
          onChange={(e) =>
            setPlacementType(e.target.value as typeof placementType)
          }
          className="block w-full rounded-md border border-border bg-background px-2 py-1 text-sm capitalize"
        >
          {PLACEMENT_TYPES.map((pt) => (
            <option key={pt} value={pt}>
              {pt}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1 md:col-span-2">
        <label className="text-xs font-medium">Notes</label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional — shown only to you"
          className="block w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
        />
      </div>
      <div className="md:col-span-4 flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          {error ? <span className="text-red-700">{error}</span> : null}
          <details className="mt-1">
            <summary className="cursor-pointer">Metadata (read-only)</summary>
            <pre className="mt-1 rounded border border-border bg-background p-2 text-xs">
              {JSON.stringify(link.metadata, null, 2)}
            </pre>
          </details>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={archive}
            className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs text-red-700 hover:bg-accent"
          >
            Archive
          </button>
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="inline-flex h-8 items-center rounded-md bg-foreground px-3 text-xs text-background disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
