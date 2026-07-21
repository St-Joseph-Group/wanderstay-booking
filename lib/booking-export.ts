// Self-contained booking export helpers — no external services.
// Generates an .ics calendar invite and a plain-text receipt from a booking.
// Dates are emitted as all-day VALUE=DATE entries so check-in/checkout never
// shift across timezones (they are property-local calendar dates).

export type BookingExport = {
  id: string;
  check_in: string; // "YYYY-MM-DD"
  check_out: string; // "YYYY-MM-DD"
  guests: number;
  nights: number;
  nightly_total: number; // cents (USD base)
  cleaning_fee: number;
  service_fee: number;
  total_price: number;
  listing?: { title: string; city: string; country: string } | null;
};

// RFC 5545 text escaping for property values.
function esc(v: string): string {
  return v
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// "YYYY-MM-DD" → "YYYYMMDD"
function icsDate(iso: string): string {
  return iso.replace(/-/g, "");
}

// A UTC timestamp "YYYYMMDDTHHMMSSZ" for DTSTAMP.
function icsStamp(now: Date): string {
  return now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

const ref = (id: string) => id.slice(0, 8).toUpperCase();

export function buildBookingIcs(b: BookingExport, now: Date): string {
  const title = b.listing?.title ?? "Wanderstay stay";
  const location = b.listing ? `${b.listing.city}, ${b.listing.country}` : "";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wanderstay//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${b.id}@wanderstay`,
    `DTSTAMP:${icsStamp(now)}`,
    `SUMMARY:${esc(title)}`,
    // All-day, timezone-safe. DTEND is exclusive → the checkout date.
    `DTSTART;VALUE=DATE:${icsDate(b.check_in)}`,
    `DTEND;VALUE=DATE:${icsDate(b.check_out)}`,
    location ? `LOCATION:${esc(location)}` : "",
    `DESCRIPTION:${esc(
      `Booking ${ref(b.id)} · ${b.guests} guest(s) · ${b.nights} night(s)`
    )}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n");
}

const usd = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export function buildReceiptText(
  b: BookingExport,
  tax: number,
  taxLabel: string
): string {
  const subtotal = b.nightly_total + b.cleaning_fee + b.service_fee;
  const total = subtotal + tax;
  const rows = [
    "WANDERSTAY — BOOKING RECEIPT",
    "===========================",
    `Reference:   ${ref(b.id)}`,
    b.listing ? `Property:    ${b.listing.title}` : "",
    b.listing ? `Location:    ${b.listing.city}, ${b.listing.country}` : "",
    `Check-in:    ${b.check_in}`,
    `Checkout:    ${b.check_out}`,
    `Guests:      ${b.guests}`,
    `Nights:      ${b.nights}`,
    "",
    "Payment summary (USD)",
    "---------------------",
    `Accommodation:  ${usd(b.nightly_total)}`,
    `Cleaning fee:   ${usd(b.cleaning_fee)}`,
    `Service fee:    ${usd(b.service_fee)}`,
    tax > 0 ? `${taxLabel}:  ${usd(tax)}` : "",
    `TOTAL:          ${usd(total)}`,
    "",
    "Amounts are in USD, the currency in which the booking is recorded.",
  ].filter(Boolean);
  return rows.join("\n");
}
