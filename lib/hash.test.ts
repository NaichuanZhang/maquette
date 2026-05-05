import { describe, it, expect } from "vitest";
import { hashWithSalt } from "./hash";

describe("hashWithSalt", () => {
  const SALT = "test-salt-abc123";

  it("returns a 64-char lowercase hex string", () => {
    const hash = hashWithSalt(SALT, "192.168.1.1");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic for identical (salt, value) pairs", () => {
    expect(hashWithSalt(SALT, "192.168.1.1")).toBe(
      hashWithSalt(SALT, "192.168.1.1"),
    );
  });

  it("produces different hashes for different values", () => {
    expect(hashWithSalt(SALT, "192.168.1.1")).not.toBe(
      hashWithSalt(SALT, "192.168.1.2"),
    );
  });

  it("produces different hashes for different salts", () => {
    expect(hashWithSalt("salt-a", "same-value")).not.toBe(
      hashWithSalt("salt-b", "same-value"),
    );
  });

  it("treats empty or nullish input as a stable sentinel", () => {
    const a = hashWithSalt(SALT, "");
    const b = hashWithSalt(SALT, null);
    const c = hashWithSalt(SALT, undefined);
    expect(a).toBe(b);
    expect(b).toBe(c);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
});
