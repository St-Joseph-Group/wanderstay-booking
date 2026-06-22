import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import { CheckCircle2, CalendarCheck, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriceBreakdownRows } from "@/components/price-breakdown";
import { getBookingById } from "@/lib/queries";
import { getSessionProfile } from "@/lib/auth";

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

      <div className="overflow-hidden rounded-2xl border border-neutral-200">
        {booking.listing && (
          <div className="flex gap-4 border-b border-neutral-200 p-5">
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

        <div className="grid grid-cols-1 gap-4 border-b border-neutral-200 p-5 sm:grid-cols-2">
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
            breakdown={{
              nights: booking.nights,
              nightlyRate:
                booking.nights > 0
                  ? Math.round(booking.nightly_total / booking.nights)
                  : 0,
              nightlyTotal: booking.nightly_total,
              cleaningFee: booking.cleaning_fee,
              serviceFee: booking.service_fee,
              total: booking.total_price,
            }}
          />
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
