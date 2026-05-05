import { describe, it, expect, beforeEach, vi } from "vitest";

describe("insforge browser client", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_INSFORGE_URL", "https://example.insforge.app");
    vi.stubEnv("NEXT_PUBLIC_INSFORGE_ANON_KEY", "anon-test-key");
  });

  it("exposes a memoized getBrowserClient factory", async () => {
    const mod = await import("./insforge");
    expect(typeof mod.getBrowserClient).toBe("function");
    const a = mod.getBrowserClient();
    const b = mod.getBrowserClient();
    expect(a).toBe(b);
  });

  it("returns a client with auth and database modules", async () => {
    const { getBrowserClient } = await import("./insforge");
    const client = getBrowserClient();
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
    expect(client.database).toBeDefined();
  });

  it("throws a clear error when env vars are missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_INSFORGE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_INSFORGE_ANON_KEY", "");
    const { getBrowserClient } = await import("./insforge");
    expect(() => getBrowserClient()).toThrow(/NEXT_PUBLIC_INSFORGE/);
  });
});
