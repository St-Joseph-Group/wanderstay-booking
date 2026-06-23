import { describe, it, expect } from "vitest";
import { computePricing } from "@/lib/pricing";

// computePricing is the single source of truth for booking money math —
// the booking server action, the booking card, and the stored booking row all
// rely on these exact numbers. These tests pin the behavior.
describe("computePricing", () => {
  const base = { pricePerNight: 14000, cleaningFee: 3500, serviceFeePct: 0.12 };

  it("computes nights, nightly total, fees, and grand total for a 3-night stay", () => {
    const b = computePricing(base, "2026-07-10", "2026-07-13");
    expect(b.nights).toBe(3);
    expect(b.nightlyRate).toBe(14000);
    expect(b.nightlyTotal).toBe(42000); // 14000 * 3
    expect(b.cleaningFee).toBe(3500);
    expect(b.serviceFee).toBe(5040); // round(42000 * 0.12)
    expect(b.total).toBe(50540); // 42000 + 3500 + 5040
  });

  it("treats Date objects and ISO strings identically", () => {
    const fromStrings = computePricing(base, "2026-07-10", "2026-07-13");
    const fromDates = computePricing(
      base,
      new Date(2026, 6, 10),
      new Date(2026, 6, 13)
    );
    expect(fromDates).toEqual(fromStrings);
  });

  it("zeroes everything for a zero-night range (checkout == checkin)", () => {
    const b = computePricing(base, "2026-07-10", "2026-07-10");
    expect(b.nights).toBe(0);
    expect(b.nightlyTotal).toBe(0);
    expect(b.cleaningFee).toBe(0); // cleaning only applies when there are nights
    expect(b.serviceFee).toBe(0);
    expect(b.total).toBe(0);
  });

  it("never returns negative nights when dates are inverted", () => {
    const b = computePricing(base, "2026-07-13", "2026-07-10");
    expect(b.nights).toBe(0);
    expect(b.total).toBe(0);
  });

  it("rounds the service fee to the nearest cent", () => {
    // 15999 * 1 night = 15999; 15999 * 0.12 = 1919.88 -> rounds to 1920
    const b = computePricing(
      { pricePerNight: 15999, cleaningFee: 0, serviceFeePct: 0.12 },
      "2026-07-10",
      "2026-07-11"
    );
    expect(b.nights).toBe(1);
    expect(b.serviceFee).toBe(1920);
    expect(b.total).toBe(15999 + 1920);
  });

  it("handles a zero service-fee percentage", () => {
    const b = computePricing(
      { pricePerNight: 10000, cleaningFee: 2000, serviceFeePct: 0 },
      "2026-07-10",
      "2026-07-12"
    );
    expect(b.serviceFee).toBe(0);
    expect(b.total).toBe(22000); // 20000 nightly + 2000 cleaning
  });
});
