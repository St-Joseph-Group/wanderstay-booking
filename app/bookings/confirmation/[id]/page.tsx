import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  CheckCircle2,
  CalendarCheck,
  Users,
  MapPin,
  CalendarPlus,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriceBreakdownRows } from "@/components/price-breakdown";
import { getBookingById } from "@/lib/queries";
import { getSessionProfile } from "@/lib/auth";
import { taxRuleFor } from "@/lib/tax";
import { buildBookingIcs, buildReceiptText } from "@/lib/booking-export";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSessionProfile();
  if (!session) redirect("/login");

  const booking = await getBookingById(id);
  if (!booking) notFound();

  const ci = parseISO(booking.check_in);
  const co = parseISO(booking.check_out);

  // Tax is derived from the destination for display and reconciles exactly with
  // the stored line items (stored total_price is the pre-tax subtotal today —
  // see lib/actions/bookings.ts; revisit when real payments are wired).
  const subtotal =
    booking.nightly_total + booking.cleaning_fee + booking.service_fee;
  const taxRule = taxRuleFor(booking.listing?.country);
  const tax = Math.round(subtotal * taxRule.ratePct);

  // Downloadable calendar invite + receipt (self-contained data URIs).
  const exportData = {
    id: booking.id,
    check_in: booking.check_in,
    check_out: booking.check_out,
    guests: booking.guests,
    nights: booking.nights,
    nightly_total: booking.nightly_total,
    cleaning_fee: booking.cleaning_fee,
    service_fee: booking.service_fee,
    total_price: booking.total_price,
    listing: booking.listing
      ? {
          title: booking.listing.title,
          city: booking.listing.city,
          country: booking.listing.country,
        }
      : null,
  };
  const ref8 = booking.id.slice(0, 8);
  const icsHref = `data:text/calendar;charset=utf-8,${encodeURIComponent(
    buildBookingIcs(exportData, new Date())
  )}`;
  const receiptHref = `data:text/plain;charset=utf-8,${encodeURIComponent(
    buildReceiptText(exportData, tax, taxRule.label)
  )}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-9 w-9 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">
          Your trip is booked!
        </h1>
        <p className="mt-2 text-muted">
          A confirmation has been saved to your trips. Booking #
          {booking.id.slice(0, 8)}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-hairline">
        {booking.listing && (
          <div className="flex gap-4 border-b border-hairline p-5">
            <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
              {booking.listing.photo && (
                <Image
                  src={booking.listing.photo}
                  alt={booking.listing.title}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              )}
            </div>
            <div className="min-w-0">
              <p className="line-clamp-1 font-semibold text-ink">
                {booking.listing.title}
              </p>
              <p className="mt-0.5 inline-flex items-center gap-1 text-sm text-muted">
                <MapPin className="h-3.5 w-3.5" />
                {booking.listing.city}, {booking.listing.country}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 border-b border-hairline p-5 sm:grid-cols-2">
          <Fact
            icon={CalendarCheck}
            label="Check-in"
            value={format(ci, "EEE, MMM d, yyyy")}
          />
          <Fact
            icon={CalendarCheck}
            label="Checkout"
            value={format(co, "EEE, MMM d, yyyy")}
          />
          <Fact
            icon={Users}
            label="Guests"
            value={`${booking.guests} ${booking.guests === 1 ? "guest" : "guests"}`}
          />
          <Fact
            icon={CalendarCheck}
            label="Nights"
            value={`${booking.nights}`}
          />
        </div>

        <div className="p-5">
          <h2 className="mb-4 font-bold text-ink">Payment summary</h2>
          <PriceBreakdownRows
            taxLabel={taxRule.label}
            breakdown={{
              nights: booking.nights,
              nightlyRate:
                booking.nights > 0
                  ? Math.round(booking.nightly_total / booking.nights)
                  : 0,
              nightlyTotal: booking.nightly_total,
              cleaningFee: booking.cleaning_fee,
              serviceFee: booking.service_fee,
              taxRatePct: taxRule.ratePct,
              tax,
              total: subtotal + tax,
            }}
          />

          <div className="mt-5 flex flex-col gap-2 border-t border-hairline pt-4 sm:flex-row">
            <a
              href={icsHref}
              download={`wanderstay-${ref8}.ics`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-hairline px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              <CalendarPlus className="h-4 w-4" strokeWidth={1.75} /> Add to calendar
            </a>
            <a
              href={receiptHref}
              download={`wanderstay-receipt-${ref8}.txt`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-hairline px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              <Download className="h-4 w-4" strokeWidth={1.75} /> Download receipt
            </a>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href="/trips" className="flex-1">
          <Button variant="dark" size="lg" className="w-full">
            View my trips
          </Button>
        </Link>
        <Link href="/search" className="flex-1">
          <Button variant="outline" size="lg" className="w-full">
            Keep exploring
          </Button>
        </Link>
      </div>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 text-ink" />
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}
