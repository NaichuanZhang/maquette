import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/insforge-server";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mode?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const params = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-6">
        <header className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            to your Maquette dashboard
          </p>
        </header>

        {params.error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
            {decodeURIComponent(params.error)}
          </div>
        ) : null}

        <LoginForm initialMode={params.mode === "signup" ? "signup" : "signin"} />
      </div>
    </main>
  );
}
