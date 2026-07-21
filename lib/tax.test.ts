import { describe, it, expect } from "vitest";
import { taxRuleFor } from "@/lib/tax";

describe("taxRuleFor", () => {
  it("returns the specific rule for a known country", () => {
    const ph = taxRuleFor("Philippines");
    expect(ph.ratePct).toBe(0.12);
    expect(ph.label).toMatch(/VAT/i);
  });

  it("trims whitespace before matching", () => {
    expect(taxRuleFor("  Japan  ").ratePct).toBe(taxRuleFor("Japan").ratePct);
  });

  it("falls back to a default rule for unknown / missing countries", () => {
    const unknown = taxRuleFor("Atlantis");
    const nullish = taxRuleFor(null);
    const undef = taxRuleFor(undefined);
    expect(unknown).toEqual(nullish);
    expect(nullish).toEqual(undef);
    expect(unknown.ratePct).toBeGreaterThan(0);
    expect(typeof unknown.label).toBe("string");
  });
});
