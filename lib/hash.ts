import { createHash } from "node:crypto";

const EMPTY_SENTINEL = "__empty__";

export function hashWithSalt(salt: string, value: string | null | undefined): string {
  const input = value == null || value === "" ? EMPTY_SENTINEL : value;
  return createHash("sha256").update(`${salt}:${input}`).digest("hex");
}
