"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Minus, Plus, Users, BedDouble, Bath, Ruler } from "lucide-react";
import { type DateRange } from "@/components/date-range-picker";
import { PremiumDatePicker } from "@/components/premium-date-picker";
import { PriceBreakdownRows } from "@/components/price-breakdown";
import { Button } from "@/components/ui/button";
import { computePricing, pricingInputFor } from "@/lib/pricing";
import { taxRuleFor } from "@/lib/tax";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/lib/currency";
import { cancellationLabel } from "@/lib/listing-meta";
import { ShieldCheck, Tag, BadgeCheck } from "lucide-react";
import type { RoomTypeDetail } from "@/lib/queries";

/** Free rooms of a type for a date range = instances with no overlapping booking. */
function availableCount(rt: RoomTypeDetail, from: Date, to: Date): number {
  const booked = new Set<string>();
  for (const b of rt.bookings) {
    const bIn = parseISO(b.check_in);
    const bOut = parseISO(b.check_out);
    if (bIn < to && bOut > from) booked.add(b.room_instance_id); // half-open overlap
  }
  return Math.max(0, rt.totalInstances - booked.size);
}

export function RoomSelection({
  listingId,
  roomTypes,
  rating,
  reviewCount,
  isAuthed,
  cancellationPolicy,
  country,
}: {
  listingId: string;
  roomTypes: RoomTypeDetail[];
  rating: number | null;
  reviewCount: number;
  isAuthed: boolean;
  cancellationPolicy?: string | null;
  country?: string | null;
}) {
  const router = useRouter();
  const { format: money } = useCurrency();
  const taxRule = taxRuleFor(country);
  const [range, setRange] = React.useState<DateRange | undefined>();
  const [guests, setGuests] = React.useState(1);
  const [showCal, setShowCal] = React.useState(false);

  const minPrice = Math.min(...roomTypes.map((r) => r.price_per_night));
  // Cheapest room type stands in for pricing/availability shown in the date
  // picker before the guest has chosen a specific room below.
  const referenceRoomType =
    roomTypes.find((r) => r.price_per_night === minPrice) ?? roomTypes[0];

  // A date is fully blocked only when every room type is sold out for it.
  // Bounded to the breakpoints formed by actual booking edges, not a
  // per-calendar-day scan over an open-ended future range.
  const blockedRanges = React.useMemo(() => {
    const points = new Set<number>();
    for (const rt of roomTypes) {
      for (const b of rt.bookings) {
        points.add(parseISO(b.check_in).getTime());
        points.add(parseISO(b.check_out).getTime());
      }
    }
    const sorted = [...points].sort((a, b) => a - b);
    const blocked: { from: Date; to: Date }[] = [];
    let runStart: number | null = null;
    for (let i = 0; i < sorted.length - 1; i++) {
      const from = new Date(sorted[i]);
      const to = new Date(sorted[i + 1]);
      const allSoldOut = roomTypes.every(
        (rt) => availableCount(rt, from, to) === 0
      );
      if (allSoldOut) {
        runStart ??= sorted[i];
      } else if (runStart !== null) {
        blocked.push({ from: new Date(runStart), to: from });
        runStart = null;
      }
    }
    if (runStart !== null) {
      blocked.push({
        from: new Date(runStart),
        to: new Date(sorted[sorted.length - 1]),
      });
    }
    return blocked;
  }, [roomTypes]);
  const maxCap = Math.max(1, ...roomTypes.map((r) => r.max_guests));
  // A usable stay needs check-out strictly after check-in. react-day-picker
  // sets to === from on the first click, so guard against that 0-night range.
  const hasDates =
    !!(range?.from && range?.to) &&
    range!.to!.getTime() > range!.from!.getTime();
  const multi = roomTypes.length > 1;

  function reserve(rt: RoomTypeDetail) {
    if (
      !range?.from ||
      !range?.to ||
      range.to.getTime() <= range.from.getTime()
    ) {
      setShowCal(true);
      return;
    }
    const params = new URLSearchParams({
      room: rt.id,
      checkin: format(range.from, "yyyy-MM-dd"),
      checkout: format(range.to, "yyyy-MM-dd"),
      guests: String(guests),
    });
    const target = `/book/${listingId}?${params.toString()}`;
    router.push(isAuthed ? target : `/login?next=${encodeURIComponent(target)}`);
  }

  return (
    <div className="relative rounded-2xl border border-hairline bg-surface p-6 shadow-card">
      <div className="flex items-baseline justify-between border-b border-hairline pb-4">
        <p className="flex items-baseline gap-1.5 text-ink">
          {multi && <span className="overline-sm text-muted">from</span>}
          <span className="numeral text-2xl">{money(minPrice)}</span>
          <span className="text-sm text-muted">/ night</span>
        </p>
        {rating !== null && (
          <span className="inline-flex items-baseline gap-1 text-sm text-ink">
            <span aria-hidden className="text-[0.7em] text-accent">◆</span>
            <span className="numeral">{rating.toFixed(2)}</span>
            <span className="overline-sm text-muted">· {reviewCount}</span>
          </span>
        )}
      </div>

      {/* Shared dates + guests */}
      <div className="mt-5 overflow-hidden rounded-sm border border-hairline">
        <div className="grid grid-cols-2">
          <button
            onClick={() => setShowCal((s) => !s)}
            className="border-r border-hairline px-4 py-3 text-left transition-colors hover:bg-black/[0.02]"
          >
            <span className="overline-sm block text-muted">Check-in</span>
            <span className={cn("mt-0.5 block text-sm", range?.from ? "text-ink" : "text-muted")}>
              {range?.from ? format(range.from, "MMM d, yyyy") : "Add date"}
            </span>
          </button>
          <button onClick={() => setShowCal((s) => !s)} className="px-4 py-3 text-left transition-colors hover:bg-black/[0.02]">
            <span className="overline-sm block text-muted">Checkout</span>
            <span className={cn("mt-0.5 block text-sm", hasDates ? "text-ink" : "text-muted")}>
              {hasDates ? format(range!.to!, "MMM d, yyyy") : "Add date"}
            </span>
          </button>
        </div>
        <div className="flex items-center justify-between border-t border-hairline px-4 py-3">
          <div>
            <span className="overline-sm block text-muted">Guests</span>
            <span className="mt-0.5 block text-sm text-ink">
              {guests} {guests === 1 ? "guest" : "guests"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setGuests((g) => Math.max(1, g - 1))}
              disabled={guests <= 1}
              aria-label="Decrease guests"
              className="flex h-11 w-11 items-center justify-center disabled:opacity-40"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-sm border border-hairline">
                <Minus className="h-3.5 w-3.5" />
              </span>
            </button>
            <span className="numeral w-4 text-center text-sm">{guests}</span>
            <button
              onClick={() => setGuests((g) => Math.min(maxCap, g + 1))}
              disabled={guests >= maxCap}
              aria-label="Increase guests"
              className="flex h-11 w-11 items-center justify-center disabled:opacity-40"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-sm border border-hairline">
                <Plus className="h-3.5 w-3.5" />
              </span>
            </button>
          </div>
        </div>
      </div>

      <PremiumDatePicker
        open={showCal}
        onClose={() => setShowCal(false)}
        range={range}
        onChange={setRange}
        onContinue={() => setShowCal(false)}
        disabledRanges={blockedRanges}
        pricing={pricingInputFor(referenceRoomType, taxRule)}
        taxLabel={taxRule.label}
        availability={
          hasDates
            ? {
                avail: availableCount(referenceRoomType, range!.from!, range!.to!),
                total: referenceRoomType.totalInstances,
              }
            : null
        }
        cancellationPolicy={cancellationPolicy}
        seed={listingId}
      />

      {/* Choose your room */}
      {multi && (
        <h3 className="overline mt-6 text-ink">Choose your room</h3>
      )}
      <div className="mt-3 space-y-3">
        {roomTypes.map((rt) => {
          const avail = hasDates
            ? availableCount(rt, range!.from!, range!.to!)
            : rt.totalInstances;
          const soldOut = hasDates && avail === 0;
          const tooMany = guests > rt.max_guests;
          const breakdown = hasDates
            ? computePricing(
                pricingInputFor(rt, taxRule),
                range!.from!,
                range!.to!
              )
            : null;

          return (
            <div
              key={rt.id}
              className={cn(
                "rounded-sm border border-hairline p-4",
                soldOut && "opacity-60"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-lg text-ink">{rt.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {rt.max_guests}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <BedDouble className="h-3.5 w-3.5" />
                      {rt.beds}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Bath className="h-3.5 w-3.5" />
                      {rt.bathrooms}
                    </span>
                    {rt.size_sqm && (
                      <span className="inline-flex items-center gap-1">
                        <Ruler className="h-3.5 w-3.5" />
                        {rt.size_sqm} m²
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-ink">
                    <span className="numeral text-lg">
                      {money(rt.price_per_night)}
                    </span>
                    <span className="text-xs text-muted"> / night</span>
                  </p>
                  {hasDates && (
                    <p
                      className={cn(
                        "overline-sm mt-1",
                        soldOut
                          ? "text-muted"
                          : avail <= 2
                            ? "text-accent-dark"
                            : "text-ink"
                      )}
                    >
                      {soldOut ? "Sold out" : `${avail} left`}
                    </p>
                  )}
                </div>
              </div>

              {breakdown && breakdown.nights > 0 && !soldOut && (
                <div className="mt-3 border-t border-hairline pt-3">
                  <PriceBreakdownRows breakdown={breakdown} taxLabel={taxRule.label} />
                </div>
              )}

              {tooMany && hasDates && (
                <p className="mt-2 text-xs text-accent-dark">
                  Holds up to {rt.max_guests} guests — lower your guest count.
                </p>
              )}

              <Button
                onClick={() => reserve(rt)}
                variant="dark"
                size="md"
                className="mt-3 w-full"
                disabled={soldOut || (hasDates && tooMany)}
              >
                {!hasDates ? "Check availability" : soldOut ? "Sold out" : "Reserve"}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="overline-sm mt-4 text-center text-muted">
        You won&apos;t be charged yet
      </p>

      {/* Assurances */}
      <ul className="mt-5 space-y-2.5 border-t border-hairline pt-5 text-sm text-ink">
        <li className="flex items-center gap-2.5">
          <ShieldCheck className="h-4 w-4 text-accent-dark" strokeWidth={1.5} />
          {cancellationLabel(cancellationPolicy)}
        </li>
        <li className="flex items-center gap-2.5">
          <Tag className="h-4 w-4 text-accent-dark" strokeWidth={1.5} />
          Transparent pricing
        </li>
        <li className="flex items-center gap-2.5">
          <BadgeCheck className="h-4 w-4 text-accent-dark" strokeWidth={1.5} />
          No hidden fees
        </li>
      </ul>
    </div>
  );
}
