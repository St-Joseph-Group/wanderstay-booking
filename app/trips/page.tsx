import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { MapPin, Luggage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CancelTripButton } from "@/components/cancel-trip-button";
import { getUserTrips, type BookingWithListing } from "@/lib/queries";
import { getSessionProfile } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";

export default async function TripsPage() {
  const session = await getSessionProfile();
  if (!session) redirect("/login?next=/trips");

  const trips = await getUserTrips();
  const today = startOfDay(new Date());
  const upcoming = trips.filter(
    (t) => t.status !== "cancelled" && !isBefore(parseISO(t.check_out), today)
  );
  const past = trips.filter(
    (t) => t.status === "cancelled" || isBefore(parseISO(t.check_out), today)
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold text-ink">Trips</h1>

      {trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-hairline py-20 text-center">
          <Luggage className="mb-3 h-10 w-10 text-muted" />
          <p className="text-lg font-semibold text-ink">No trips booked… yet!</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Time to dust off your bags and start planning your next adventure.
          </p>
          <Link href="/search" className="mt-5">
            <Button variant="dark">Start searching</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {upcoming.length > 0 && (
            <Section title="Upcoming">
              {upcoming.map((t) => (
                <TripCard key={t.id} trip={t} cancellable />
              ))}
            </Section>
          )}
          {past.length > 0 && (
            <Section title="Where you've been">
              {past.map((t) => (
                <TripCard key={t.id} trip={t} />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-bold text-ink">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function TripCard({
  trip,
  cancellable,
}: {
  trip: BookingWithListing;
  cancellable?: boolean;
}) {
  const ci = parseISO(trip.check_in);
  const co = parseISO(trip.check_out);
  const cancelled = trip.status === "cancelled";

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-hairline p-4 sm:flex-row">
      <Link
        href={trip.listing ? `/listings/${trip.listing.id}` : "#"}
        className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:h-32 sm:w-48"
      >
        {trip.listing?.photo && (
          <Image
            src={trip.listing.photo}
            alt={trip.listing.title}
            fill
            sizes="(max-width: 640px) 100vw, 192px"
            className="object-cover"
          />
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="line-clamp-1 font-semibold text-ink">
              {trip.listing?.title ?? "Listing removed"}
            </h3>
            {cancelled && (
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-muted">
                Cancelled
              </span>
            )}
          </div>
          {trip.listing && (
            <p className="mt-0.5 inline-flex items-center gap-1 text-sm text-muted">
              <MapPin className="h-3.5 w-3.5" />
              {trip.listing.city}, {trip.listing.country}
            </p>
          )}
          <p className="mt-1 text-sm text-ink">
            {format(ci, "MMM d")} – {format(co, "MMM d, yyyy")} ·{" "}
            {trip.guests} {trip.guests === 1 ? "guest" : "guests"}
          </p>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-semibold text-ink">
            {formatPrice(trip.total_price)}{" "}
            <span className="font-normal text-muted">total</span>
          </span>
          {cancellable && !cancelled && (
            <CancelTripButton bookingId={trip.id} />
          )}
        </div>
      </div>
    </div>
  );
}
