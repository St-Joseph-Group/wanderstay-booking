import { describe, it, expect } from "vitest";
import { buildBookingIcs, buildReceiptText, type BookingExport } from "@/lib/booking-export";

const booking: BookingExport = {
  id: "a0000000-0000-0000-0000-000000000abc",
  check_in: "2026-07-10",
  check_out: "2026-07-13",
  guests: 2,
  nights: 3,
  nightly_total: 42000,
  cleaning_fee: 3500,
  service_fee: 5040,
  total_price: 50540,
  listing: { title: "Cliffside Villa", city: "Bali", country: "Indonesia" },
};

describe("buildBookingIcs", () => {
  const ics = buildBookingIcs(booking, new Date("2026-07-01T09:00:00Z"));

  it("emits all-day dates with no timezone shift", () => {
    expect(ics).toContain("DTSTART;VALUE=DATE:20260710");
    expect(ics).toContain("DTEND;VALUE=DATE:20260713");
  });

  it("is a well-formed VEVENT with CRLF line endings", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR")).toBe(true);
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("\r\n");
    expect(ics).toContain("SUMMARY:Cliffside Villa");
    expect(ics).toContain("LOCATION:Bali\\, Indonesia"); // comma escaped per RFC 5545
  });
});

describe("buildReceiptText", () => {
  it("itemizes and reconciles the total including tax", () => {
    const tax = 6065;
    const r = buildReceiptText(booking, tax, "VAT (11%)");
    expect(r).toContain("$420.00"); // accommodation
    expect(r).toContain("VAT (11%)");
    expect(r).toContain("$60.65"); // tax
    expect(r).toContain("$566.05"); // 50540 + 6065 = 56605 cents
  });

  it("omits the tax line when tax is zero", () => {
    const r = buildReceiptText(booking, 0, "Taxes");
    expect(r).not.toContain("Taxes:");
    expect(r).toContain("$505.40"); // subtotal == total
  });
});
