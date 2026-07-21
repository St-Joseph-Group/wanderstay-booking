import {
  buildReceiptText,
  type BookingExport,
} from "@/lib/booking-export";

const usd = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const ref = (id: string) => id.slice(0, 8).toUpperCase();

// Builds the booking-confirmation email (subject + HTML + plain-text). HTML uses
// inline styles for email-client compatibility. Amounts are USD (booking base).
export function bookingConfirmationEmail(
  b: BookingExport,
  tax: number,
  taxLabel: string
) {
  const subtotal = b.nightly_total + b.cleaning_fee + b.service_fee;
  const total = subtotal + tax;
  const title = b.listing?.title ?? "your stay";
  const where = b.listing ? `${b.listing.city}, ${b.listing.country}` : "";

  const row = (label: string, value: string, strong = false) =>
    `<tr>
      <td style="padding:6px 0;color:#8b8074;font-size:14px;">${label}</td>
      <td style="padding:6px 0;text-align:right;color:#3d352d;font-size:14px;${
        strong ? "font-weight:700;" : ""
      }">${value}</td>
    </tr>`;

  const html = `<!DOCTYPE html>
<html><body style="margin:0;background:#f8f3ea;font-family:Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <p style="color:#965a41;font-size:13px;letter-spacing:1px;margin:0 0 8px;">WANDERSTAY</p>
    <h1 style="color:#3d352d;font-size:26px;margin:0 0 4px;">Your stay is confirmed</h1>
    <p style="color:#8b8074;font-size:15px;margin:0 0 24px;">
      Booking reference <strong style="color:#3d352d;">${ref(b.id)}</strong>
    </p>
    <div style="background:#fffdf8;border:1px solid #e2d7c5;border-radius:16px;padding:24px;">
      <h2 style="color:#3d352d;font-size:19px;margin:0 0 4px;">${title}</h2>
      ${where ? `<p style="color:#8b8074;font-size:14px;margin:0 0 16px;">${where}</p>` : ""}
      <table style="width:100%;border-collapse:collapse;margin:12px 0;">
        ${row("Check-in", b.check_in)}
        ${row("Checkout", b.check_out)}
        ${row("Guests", String(b.guests))}
        ${row("Nights", String(b.nights))}
      </table>
      <hr style="border:none;border-top:1px solid #e2d7c5;margin:16px 0;" />
      <table style="width:100%;border-collapse:collapse;">
        ${row("Accommodation", usd(b.nightly_total))}
        ${b.cleaning_fee > 0 ? row("Cleaning fee", usd(b.cleaning_fee)) : ""}
        ${row("Service fee", usd(b.service_fee))}
        ${tax > 0 ? row(taxLabel, usd(tax)) : ""}
        ${row("Total", usd(total), true)}
      </table>
    </div>
    <p style="color:#8b8074;font-size:13px;margin:20px 0 0;">
      A calendar invite is attached. Amounts are shown in USD, the currency in
      which the booking is recorded. Manage this booking anytime under “My trips”.
    </p>
  </div>
</body></html>`;

  return {
    subject: `Your Wanderstay booking is confirmed — ${ref(b.id)}`,
    html,
    text: buildReceiptText(b, tax, taxLabel),
  };
}
