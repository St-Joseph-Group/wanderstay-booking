"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Minus, Plus, Star, Users, BedDouble, Bath, Ruler } from "lucide-react";
import { DateRangeCalendar, type DateRange } from "@/components/date-range-picker";
import { PriceBreakdownRows } from "@/components/price-breakdown";
import { Button } from "@/components/ui/button";
import { computePricing } from "@/lib/pricing";
import { formatPriceCompact } from "@/lib/utils";
import { cn } from "@/lib/utils";
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
}: {
  listingId: string;
  roomTypes: RoomTypeDetail[];
  rating: number | null;
  reviewCount: number;
  isAuthed: boolean;
}) {
  const router = useRouter();
  const [range, setRange] = React.useState<DateRange | undefined>();
  const [guests, setGuests] = React.useState(1);
  const [showCal, setShowCal] = React.useState(false);

  // Show two months on wider screens so an upcoming, fully-available month is
  // always visible (otherwise late in a month the current view looks empty).
  const [months, setMonths] = React.useState(1);
  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const update = () => setMonths(mq.matches ? 2 : 1);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const minPrice = Math.min(...roomTypes.map((r) => r.price_per_night));
  const maxCap = Math.max(1, ...roomTypes.map((r) => r.max_guests));
  const hasDates = !!(range?.from && range?.to);
  const multi = roomTypes.length > 1;

  function reserve(rt: RoomTypeDetail) {
    if (!range?.from || !range?.to) {
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
    <div className="relative rounded-2xl border border-neutral-200 bg-white p-5 shadow-card">
      <div className="flex items-baseline justify-between">
        <p className="text-xl text-ink">
          {multi && <span className="text-base text-muted">from </span>}
          <span className="font-bold">{formatPriceCompact(minPrice)}</span>{" "}
          <span className="text-base text-muted">night</span>
        </p>
        {rating !== null && (
          <span className="inline-flex items-center gap-1 text-sm text-ink">
            <Star className="h-3.5 w-3.5 fill-current" /> {rating.toFixed(2)}
            <span className="text-muted">· {reviewCount} reviews</span>
          </span>
        )}
      </div>

      {/* Shared dates + guests */}
      <div className="mt-4 overflow-hidden rounded-xl border border-neutral-300">
        <div className="grid grid-cols-2">
          <button
            onClick={() => setShowCal((s) => !s)}
            className="border-r border-neutral-300 px-3 py-2.5 text-left"
          >
            <span className="block text-[10px] font-bold uppercase text-ink">Check-in</span>
            <span className={cn("text-sm", range?.from ? "text-ink" : "text-muted")}>
              {range?.from ? format(range.from, "MMM d, yyyy") : "Add date"}
            </span>
          </button>
          <button onClick={() => setShowCal((s) => !s)} className="px-3 py-2.5 text-left">
            <span className="block text-[10px] font-bold uppercase text-ink">Checkout</span>
            <span className={cn("text-sm", range?.to ? "text-ink" : "text-muted")}>
              {range?.to ? format(range.to, "MMM d, yyyy") : "Add date"}
            </span>
          </button>
        </div>
        <div className="flex items-center justify-between border-t border-neutral-300 px-3 py-2.5">
          <div>
            <span className="block text-[10px] font-bold uppercase text-ink">Guests</span>
            <span className="text-sm text-ink">
              {guests} {guests === 1 ? "guest" : "guests"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setGuests((g) => Math.max(1, g - 1))}
              disabled={guests <= 1}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-300 disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-4 text-center text-sm">{guests}</span>
            <button
              onClick={() => setGuests((g) => Math.min(maxCap, g + 1))}
              disabled={guests >= maxCap}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-300 disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {showCal && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(640px,92vw)] rounded-2xl border border-neutral-200 bg-white p-3 shadow-pop">
          <div className="overflow-x-auto">
            <DateRangeCalendar
              range={range}
              onChange={setRange}
              numberOfMonths={months}
            />
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-neutral-100 pt-2">
            <button
              onClick={() => setRange(undefined)}
              className="text-sm font-semibold text-ink underline"
            >
              Clear dates
            </button>
            <button
              onClick={() => setShowCal(false)}
              className="rounded-lg bg-ink px-4 py-1.5 text-sm font-semibold text-white"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Choose your room */}
      {multi && (
        <h3 className="mt-5 text-base font-bold text-ink">Choose your room</h3>
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
                {
                  pricePerNight: rt.price_per_night,
                  cleaningFee: rt.cleaning_fee,
                  serviceFeePct: rt.serviceFeePct,
                },
                range!.from!,
                range!.to!
              )
            : null;

          return (
            <div
              key={rt.id}
              className={cn(
                "rounded-xl border p-4",
                soldOut ? "border-neutral-200 opacity-60" : "border-neutral-300"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{rt.name}</p>
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
                  <p className="text-sm text-ink">
                    <span className="font-bold">
                      {formatPriceCompact(rt.price_per_night)}
                    </span>
                    <span className="text-muted"> /night</span>
                  </p>
                  {hasDates && (
                    <p
                      className={cn(
                        "mt-0.5 text-xs font-semibold",
                        soldOut
                          ? "text-muted"
                          : avail <= 2
                            ? "text-brand"
                            : "text-green-600"
                      )}
                    >
                      {soldOut ? "Sold out" : `${avail} left`}
                    </p>
                  )}
                </div>
              </div>

              {breakdown && breakdown.nights > 0 && !soldOut && (
                <div className="mt-3 border-t border-neutral-200 pt-3">
                  <PriceBreakdownRows breakdown={breakdown} />
                </div>
              )}

              {tooMany && hasDates && (
                <p className="mt-2 text-xs text-brand">
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

      <p className="mt-3 text-center text-sm text-muted">
        You won&apos;t be charged yet
      </p>
    </div>
  );
}
