import { describe, it, expect, vi } from "vitest";
import {
  SHORT_CODE_LENGTH,
  SHORT_CODE_ALPHABET,
  generateShortCode,
  mintUniqueShortCode,
} from "./short-code";

describe("generateShortCode", () => {
  it("produces a code of the expected length", () => {
    const code = generateShortCode();
    expect(code).toHaveLength(SHORT_CODE_LENGTH);
  });

  it("uses only base62 alphabet characters", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateShortCode();
      expect(code).toMatch(/^[0-9A-Za-z]+$/);
      for (const char of code) {
        expect(SHORT_CODE_ALPHABET).toContain(char);
      }
    }
  });

  it("generates unique codes across many iterations", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 10_000; i++) seen.add(generateShortCode());
    expect(seen.size).toBe(10_000);
  });
});

describe("mintUniqueShortCode", () => {
  it("returns the first candidate when the collision check passes", async () => {
    const exists = vi.fn().mockResolvedValue(false);
    const code = await mintUniqueShortCode(exists);
    expect(exists).toHaveBeenCalledTimes(1);
    expect(code).toHaveLength(SHORT_CODE_LENGTH);
  });

  it("retries when the existence check reports a collision", async () => {
    let calls = 0;
    const exists = vi.fn().mockImplementation(async () => {
      calls += 1;
      return calls < 3;
    });
    const code = await mintUniqueShortCode(exists);
    expect(exists).toHaveBeenCalledTimes(3);
    expect(code).toHaveLength(SHORT_CODE_LENGTH);
  });

  it("throws after the configured number of collisions", async () => {
    const exists = vi.fn().mockResolvedValue(true);
    await expect(mintUniqueShortCode(exists, { maxAttempts: 4 })).rejects.toThrow(
      /after 4/i,
    );
    expect(exists).toHaveBeenCalledTimes(4);
  });
});
