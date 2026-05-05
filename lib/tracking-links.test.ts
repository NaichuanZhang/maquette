import { describe, it, expect } from "vitest";
import {
  parseCreateLinkInput,
  parseUpdateLinkInput,
  PLACEMENT_TYPES,
} from "./tracking-links";

describe("parseCreateLinkInput", () => {
  it("accepts minimal input (just a label) with default type 'other'", () => {
    const parsed = parseCreateLinkInput({ label: "EECS bulletin" });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value).toEqual({
        label: "EECS bulletin",
        placement_type: "other",
        notes: null,
        metadata: {},
      });
    }
  });

  it("trims the label", () => {
    const parsed = parseCreateLinkInput({ label: "  LinkedIn post  " });
    expect(parsed.ok && parsed.value.label).toBe("LinkedIn post");
  });

  it("rejects empty labels", () => {
    expect(parseCreateLinkInput({ label: "" }).ok).toBe(false);
    expect(parseCreateLinkInput({ label: "   " }).ok).toBe(false);
  });

  it("accepts all four placement types", () => {
    for (const pt of PLACEMENT_TYPES) {
      const parsed = parseCreateLinkInput({ label: "x", placement_type: pt });
      expect(parsed.ok && parsed.value.placement_type).toBe(pt);
    }
  });

  it("rejects unknown placement types", () => {
    const parsed = parseCreateLinkInput({
      label: "x",
      placement_type: "billboard",
    });
    expect(parsed.ok).toBe(false);
  });
});

describe("parseUpdateLinkInput", () => {
  it("allows partial updates", () => {
    const parsed = parseUpdateLinkInput({ notes: "under the elevator" });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value).toEqual({ notes: "under the elevator" });
    }
  });

  it("rejects empty-after-trim label on update", () => {
    const parsed = parseUpdateLinkInput({ label: "   " });
    expect(parsed.ok).toBe(false);
  });

  it("treats explicit empty notes as clearing the field", () => {
    const parsed = parseUpdateLinkInput({ notes: "" });
    expect(parsed.ok && parsed.value.notes).toBeNull();
  });

  it("rejects an invalid placement_type", () => {
    expect(parseUpdateLinkInput({ placement_type: "bogus" }).ok).toBe(false);
  });
});
