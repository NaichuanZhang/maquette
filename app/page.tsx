import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24">
      <div className="max-w-xl text-center flex flex-col gap-4">
        <h1 className="text-4xl font-semibold tracking-tight">Maquette</h1>
        <p className="text-muted-foreground text-lg">
          Dynamic QR codes and per-placement analytics for event posters.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="inline-flex h-10 items-center rounded-md bg-foreground px-5 text-sm font-medium text-background hover:opacity-90"
      >
        Open dashboard
      </Link>
    </main>
  );
}
