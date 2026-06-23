import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { Star, ChevronLeft } from "lucide-react";
import { CheckoutForm } from "@/components/checkout-form";
import { PriceBreakdownRows } from "@/components/price-breakdown";
import { getListingById, type RoomTypeDetail } from "@/lib/queries";
import { getSessionProfile } from "@/lib/auth";
import { computePricing } from "@/lib/pricing";

function freeRooms(rt: RoomTypeDetail, from: Date, to: Date): number {
  const booked = new Set<string>();
  for (const b of rt.bookings) {
    if (parseISO(b.check_in) < to && parseISO(b.check_out) > from)
      booked.add(b.room_instance_id);
  }
  return Math.max(0, rt.totalInstances - booked.size);
}

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ listingId: string }>;
  searchParams: Promise<{
    room?: string;
    checkin?: string;
    checkout?: string;
    guests?: string;
  }>;
}) {
  const { listingId } = await params;
  const { room, checkin, checkout, guests: guestsRaw } = await searchParams;
  const guests = Math.max(1, Number(guestsRaw ?? 1) || 1);

  const target = `/book/${listingId}?room=${room ?? ""}&checkin=${checkin ?? ""}&checkout=${checkout ?? ""}&guests=${guests}`;
  const session = await getSessionProfile();
  if (!session) redirect(`/login?next=${encodeURIComponent(target)}`);

  const listing = await getListingById(listingId);
  if (!listing) notFound();

  const rt = listing.roomTypes.find((r) => r.id === room) ?? null;

  // Validate dates + room
  if (
    !rt ||
    !checkin ||
    !checkout ||
    !/^\d{4}-\d{2}-\d{2}$/.test(checkin) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(checkout)
  ) {
    redirect(`/listings/${listingId}`);
  }
  const ci = parseISO(checkin!);
  const co = parseISO(checkout!);
  const datesValid = isBefore(ci, co) && !isBefore(ci, startOfDay(new Date()));
  const soldOut = datesValid && freeRooms(rt!, ci, co) === 0;
  const tooMany = guests > rt!.max_guests;

  const pricing = computePricing(
    {
      pricePerNight: rt!.price_per_night,
      cleaningFee: rt!.cleaning_fee,
      serviceFeePct: rt!.serviceFeePct,
    },
    ci,
    co
  );

  const blocked = !datesValid || soldOut || tooMany;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href={`/listings/${listingId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-ink hover:underline"
      >
        <ChevronLeft className="h-4 w-4" /> Back to listing
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-ink sm:text-3xl">
        Confirm and pay
      </h1>

      {blocked ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-700">
            {soldOut
              ? "That room is sold out for those dates."
              : tooMany
                ? `This room holds up to ${rt!.max_guests} guests.`
                : "The selected dates are invalid."}
          </p>
          <Link
            href={`/listings/${listingId}`}
            className="mt-3 inline-block text-sm font-semibold text-red-700 underline"
          >
            Choose a different room or dates
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Left: trip + payment */}
          <div className="order-2 lg:order-1">
            <div className="mb-6 space-y-4 border-b border-neutral-200 pb-6">
              <h2 className="text-lg font-bold text-ink">Your trip</h2>
              <DetailRow label="Room" value={rt!.name} href={`/listings/${listingId}`} />
              <DetailRow
                label="Dates"
                value={`${format(ci, "MMM d")} – ${format(co, "MMM d, yyyy")}`}
                href={`/listings/${listingId}`}
              />
              <DetailRow
                label="Guests"
                value={`${guests} ${guests === 1 ? "guest" : "guests"}`}
                href={`/listings/${listingId}`}
              />
            </div>
            <CheckoutForm
              roomTypeId={rt!.id}
              checkin={checkin!}
              checkout={checkout!}
              guests={guests}
              total={pricing.total}
            />
          </div>

          {/* Right: summary */}
          <div className="order-1 lg:order-2">
            <div className="rounded-2xl border border-neutral-200 p-5 lg:sticky lg:top-24">
              <div className="flex gap-4 border-b border-neutral-200 pb-5">
                <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                  <Image
                    src={listing.photos[0]}
                    alt={listing.title}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted">
                    {listing.city}, {listing.country}
                  </p>
                  <p className="line-clamp-2 font-semibold text-ink">
                    {listing.title}
                  </p>
                  <p className="text-sm text-muted">{rt!.name}</p>
                  {listing.rating !== null && (
                    <span className="mt-1 inline-flex items-center gap-1 text-sm text-ink">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {listing.rating.toFixed(2)}
                      <span className="text-muted">({listing.reviewCount})</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="pt-5">
                <h3 className="mb-4 text-lg font-bold text-ink">Price details</h3>
                <PriceBreakdownRows breakdown={pricing} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-semibold text-ink">{label}</p>
        <p className="text-sm text-muted">{value}</p>
      </div>
      <Link href={href} className="text-sm font-semibold text-ink underline">
        Edit
      </Link>
    </div>
  );
}
