"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTrackingLinkAction } from "./actions";

export function InlineCreateLink({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setError(null);

    const formData = new FormData();
    formData.set("label", label);
    formData.set("placement_type", "other");

    startTransition(async () => {
      const result = await createTrackingLinkAction(eventId, formData);
      if (result.ok) {
        setLabel("");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form
      onSubmit={submit}
      className="flex items-center gap-2 rounded-md border border-border bg-background p-2"
    >
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Name this placement (e.g. EECS bulletin, LinkedIn post)"
        className="flex-1 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-foreground"
      />
      <button
        type="submit"
        disabled={isPending || !label.trim()}
        className="inline-flex h-9 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background disabled:opacity-60"
      >
        {isPending ? "Adding…" : "Add link"}
      </button>
      {error ? (
        <span className="ml-2 text-xs text-red-700">{error}</span>
      ) : null}
    </form>
  );
}
