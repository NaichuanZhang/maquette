import Link from "next/link";
import { listEvents } from "./events/actions";
import { CreateEventForm } from "./events/CreateEventForm";

export const dynamic = "force-dynamic";

export default async function DashboardHomePage() {
  const events = await listEvents();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
        <CreateEventForm />
      </div>

      {events.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No events yet. Create your first event to start tracking scans.
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/dashboard/events/${event.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-accent"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{event.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {event.luma_url}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 text-sm">
                  <span className="font-semibold">{event.scan_count}</span>
                  <span className="text-muted-foreground">scans</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
