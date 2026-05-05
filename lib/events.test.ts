import { describe, it, expect } from "vitest";
import { parseEventInput } from "./events";

describe("parseEventInput", () => {
  it("accepts a valid name + https URL", () => {
    const parsed = parseEventInput({
      name: "Maquette Hackathon",
      luma_url: "https://luma.com/maquette-hack",
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value).toEqual({
        name: "Maquette Hackathon",
        luma_url: "https://luma.com/maquette-hack",
      });
    }
  });

  it("trims whitespace on name", () => {
    const parsed = parseEventInput({
      name: "  Maquette Hack  ",
      luma_url: "https://luma.com/x",
    });
    expect(parsed.ok && parsed.value.name).toBe("Maquette Hack");
  });

  it("rejects empty name", () => {
    const parsed = parseEventInput({ name: "   ", luma_url: "https://luma.com/x" });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toMatch(/name/i);
  });

  it("rejects non-http URLs", () => {
    for (const bad of ["", "not a url", "ftp://luma.com", "javascript:alert(1)"]) {
      const parsed = parseEventInput({ name: "Ok", luma_url: bad });
      expect(parsed.ok).toBe(false);
      if (!parsed.ok) expect(parsed.error).toMatch(/url/i);
    }
  });

  it("accepts http (for local testing)", () => {
    const parsed = parseEventInput({
      name: "Dev",
      luma_url: "http://localhost:3000/event",
    });
    expect(parsed.ok).toBe(true);
  });
});
