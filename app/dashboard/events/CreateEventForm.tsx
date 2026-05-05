"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createEventAction } from "./actions";

export function CreateEventForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createEventAction(formData);
      if (result.ok) {
        setOpen(false);
        router.push(`/dashboard/events/${result.id}`);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
      >
        New event
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-lg border border-border bg-background p-4 space-y-3"
    >
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium">
          Event name
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="Maquette Hackathon"
          className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="luma_url" className="text-sm font-medium">
          Destination URL (Luma)
        </label>
        <input
          id="luma_url"
          name="luma_url"
          required
          type="url"
          placeholder="https://luma.com/your-event"
          className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      {error ? (
        <p className="text-sm text-red-700">{error}</p>
      ) : null}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-9 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background disabled:opacity-60"
        >
          {isPending ? "Creating…" : "Create event"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
