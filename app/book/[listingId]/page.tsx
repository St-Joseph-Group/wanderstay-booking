import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import {
  format,
  parseISO,
  isBefore,
  startOfDay,
  subDays,
  differenceInCalendarDays,
} from "date-fns";
import {
  Star,
  ChevronLeft,
  Home,
  CalendarDays,
  Moon,
  Users,
  ShieldCheck,
  BadgeCheck,
} from "lucide-react";
import { CheckoutForm } from "@/components/checkout-form";
import { PriceBreakdownRows } from "@/components/price-breakdown";
import { getListingById, type RoomTypeDetail } from "@/lib/queries";
import { getSessionProfile } from "@/lib/auth";
import { computePricing } from "@/lib/pricing";
import { taxRuleFor } from "@/lib/tax";

function freeRooms(rt: RoomTypeDetail, from: Date, to: Date): number {
  const booked = new Set<string>();
  for (const b of rt.bookings) {
    if (parseISO(b.check_in) < to && parseISO(b.check_out) > from)
      booked.add(b.room_instance_id);
  }
  return Math.max(0, rt.totalInstances - booked.size);
}

const STEPS = ["Search", "Property", "Review", "Payment"];

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

  const taxRule = taxRuleFor(listing.country);
  const pricing = computePricing(
    {
      pricePerNight: rt!.price_per_night,
      cleaningFee: rt!.cleaning_fee,
      serviceFeePct: rt!.serviceFeePct,
      taxRatePct: taxRule.ratePct,
    },
    ci,
    co
  );

  const blocked = !datesValid || soldOut || tooMany;

  // Cancellation window from the listing's policy.
  const policy = listing.cancellation_policy;
  const daysBefore = policy === "flexible" ? 1 : policy === "strict" ? 14 : 5;
  const freeCancelDate = subDays(ci, daysBefore);
  const freeCancelLabel = format(freeCancelDate, "MMMM d, yyyy");
  const nights = pricing.nights || differenceInCalendarDays(co, ci);

  const stay = [
    { icon: Home, label: "Your stay", value: rt!.name },
    {
      icon: CalendarDays,
      label: "Dates",
      value: `${format(ci, "MMM d")} – ${format(co, "MMM d, yyyy")}`,
    },
    { icon: Moon, label: "Length", value: `${nights} night${nights === 1 ? "" : "s"}` },
    { icon: Users, label: "Guests", value: `${guests} ${guests === 1 ? "guest" : "guests"}` },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href={`/listings/${listingId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-ink hover:underline"
      >
        <ChevronLeft className="h-4 w-4" /> Back to listing
      </Link>

      {/* Progress */}
      <ol className="mb-7 flex items-center gap-2 text-sm">
        {STEPS.map((s, i) => {
          const active = i === 3;
          const done = i < 3;
          return (
            <li key={s} className="flex items-center gap-2">
              <span
                className={
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold " +
                  (active
                    ? "bg-brand text-white"
                    : done
                      ? "bg-accent-soft text-accent-dark"
                      : "bg-neutral-200 text-muted")
                }
              >
                {i + 1}
              </span>
              <span
                className={
                  active ? "font-semibold text-ink" : "text-muted"
                }
              >
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <span className="mx-1 h-px w-6 bg-line sm:w-10" />
              )}
            </li>
          );
        })}
      </ol>

      <h1 className="mb-8 font-display text-3xl font-semibold text-ink sm:text-4xl">
        Confirm and pay
      </h1>

      {blocked ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
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
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Left: stay + payment + policy */}
          <div className="order-2 space-y-8 lg:order-1">
            {/* Your Stay */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-ink">Your stay</h2>
              <div className="grid grid-cols-2 gap-4">
                {stay.map((s) => (
                  <div
                    key={s.label}
                    className="flex items-start gap-3 rounded-xl border border-hairline bg-surface p-4 shadow-card"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-dark">
                      <s.icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-muted">
                        {s.label}
                      </p>
                      <p className="font-semibold text-ink">{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href={`/listings/${listingId}`}
                className="mt-3 inline-block text-sm font-semibold text-ink underline"
              >
                Edit trip details
              </Link>
            </section>

            <CheckoutForm
              roomTypeId={rt!.id}
              checkin={checkin!}
              checkout={checkout!}
              guests={guests}
              total={pricing.total}
              freeCancelLabel={freeCancelLabel}
            />

            {/* Cancellation policy */}
            <section className="rounded-xl border border-hairline bg-surface p-5 shadow-card">
              <h2 className="mb-2 text-lg font-bold text-ink">
                Cancellation policy
              </h2>
              <p className="text-sm leading-relaxed text-ink">
                <span className="font-semibold">Free cancellation</span> until{" "}
                {freeCancelLabel}.
              </p>
              <p className="mt-1 text-sm text-muted">
                Cancel after {freeCancelLabel}: 50% refund of the nightly total.
              </p>
            </section>
          </div>

          {/* Right: summary */}
          <div className="order-1 lg:order-2">
            <div className="space-y-5 lg:sticky lg:top-24">
              <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-card">
                <div className="relative h-44 w-full bg-neutral-100">
                  <Image
                    src={listing.photos[0]}
                    alt={listing.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 480px"
                    className="object-cover"
                  />
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <p className="text-xs opacity-90">
                      {listing.city}, {listing.country}
                    </p>
                    <p className="line-clamp-1 font-display text-lg font-semibold">
                      {listing.title}
                    </p>
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-4 flex items-center justify-between text-sm">
                    <span className="text-muted">{rt!.name}</span>
                    {listing.rating !== null && (
                      <span className="inline-flex items-center gap-1 text-ink">
                        <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                        {listing.rating.toFixed(2)}
                        <span className="text-muted">
                          ({listing.reviewCount})
                        </span>
                      </span>
                    )}
                  </div>
                  <h3 className="mb-4 text-lg font-bold text-ink">
                    Price details
                  </h3>
                  <PriceBreakdownRows breakdown={pricing} taxLabel={taxRule.label} />
                </div>
              </div>

              {/* Trust + accepted payments */}
              <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-card">
                <ul className="space-y-2.5 text-sm text-ink">
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-accent-dark" /> Secure
                    checkout
                  </li>
                  <li className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-accent-dark" /> Free
                    cancellation until {freeCancelLabel}
                  </li>
                  <li className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-accent-dark" /> Protected
                    by Wanderstay
                  </li>
                  <li className="flex items-center gap-2 text-muted">
                    <Star className="h-4 w-4 text-accent-dark" /> Your card
                    won&apos;t be charged until the booking is confirmed
                  </li>
                </ul>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-hairline pt-4">
                  <span className="text-xs text-muted">We accept</span>
                  {["Visa", "Mastercard", "GCash", "Maya"].map((p) => (
                    <span
                      key={p}
                      className="rounded-md border border-hairline bg-canvas px-2 py-1 text-xs font-semibold text-ink"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
