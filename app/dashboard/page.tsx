export default async function DashboardHomePage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        You don&apos;t have any events yet.
      </p>
    </div>
  );
}
