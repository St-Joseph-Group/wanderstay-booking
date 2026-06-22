"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format, parseISO, subDays } from "date-fns";
import { Minus, Plus, Star } from "lucide-react";
import { DateRangeCalendar, type DateRange } from "@/components/date-range-picker";
import { PriceBreakdownRows } from "@/components/price-breakdown";
import { Button } from "@/components/ui/button";
import { computePricing } from "@/lib/pricing";
import { formatPriceCompact } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function BookingCard({
  listingId,
  pricePerNight,
  cleaningFee,
  serviceFeePct,
  maxGuests,
  rating,
  reviewCount,
  bookedRanges,
  isAuthed,
}: {
  listingId: string;
  pricePerNight: number;
  cleaningFee: number;
  serviceFeePct: number;
  maxGuests: number;
  rating: number | null;
  reviewCount: number;
  bookedRanges: { check_in: string; check_out: string }[];
  isAuthed: boolean;
}) {
  const router = useRouter();
  const [range, setRange] = React.useState<DateRange | undefined>();
  const [guests, setGuests] = React.useState(1);
  const [showCal, setShowCal] = React.useState(false);

  const disabled = React.useMemo(
    () =>
      bookedRanges.map((b) => ({
        from: parseISO(b.check_in),
        to: subDays(parseISO(b.check_out), 1),
      })),
    [bookedRanges]
  );

  const breakdown = React.useMemo(() => {
    if (!range?.from || !range?.to) return null;
    return computePricing(
      { pricePerNight, cleaningFee, serviceFeePct },
      range.from,
      range.to
    );
  }, [range, pricePerNight, cleaningFee, serviceFeePct]);

  function reserve() {
    if (!range?.from || !range?.to) {
      setShowCal(true);
      return;
    }
    const params = new URLSearchParams({
      checkin: format(range.from, "yyyy-MM-dd"),
      checkout: format(range.to, "yyyy-MM-dd"),
      guests: String(guests),
    });
    const target = `/book/${listingId}?${params.toString()}`;
    if (!isAuthed) {
      router.push(`/login?next=${encodeURIComponent(target)}`);
      return;
    }
    router.push(target);
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-card">
      <div className="flex items-baseline justify-between">
        <p className="text-xl text-ink">
          <span className="font-bold">{formatPriceCompact(pricePerNight)}</span>{" "}
          <span className="text-base text-muted">night</span>
        </p>
        {rating !== null && (
          <span className="inline-flex items-center gap-1 text-sm text-ink">
            <Star className="h-3.5 w-3.5 fill-current" /> {rating.toFixed(2)}
            <span className="text-muted">· {reviewCount} reviews</span>
          </span>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-neutral-300">
        <div className="grid grid-cols-2">
          <button
            onClick={() => setShowCal((s) => !s)}
            className="border-r border-neutral-300 px-3 py-2.5 text-left"
          >
            <span className="block text-[10px] font-bold uppercase text-ink">
              Check-in
            </span>
            <span className={cn("text-sm", range?.from ? "text-ink" : "text-muted")}>
              {range?.from ? format(range.from, "MMM d, yyyy") : "Add date"}
            </span>
          </button>
          <button
            onClick={() => setShowCal((s) => !s)}
            className="px-3 py-2.5 text-left"
          >
            <span className="block text-[10px] font-bold uppercase text-ink">
              Checkout
            </span>
            <span className={cn("text-sm", range?.to ? "text-ink" : "text-muted")}>
              {range?.to ? format(range.to, "MMM d, yyyy") : "Add date"}
            </span>
          </button>
        </div>
        <div className="flex items-center justify-between border-t border-neutral-300 px-3 py-2.5">
          <div>
            <span className="block text-[10px] font-bold uppercase text-ink">
              Guests
            </span>
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
              onClick={() => setGuests((g) => Math.min(maxGuests, g + 1))}
              disabled={guests >= maxGuests}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-300 disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {showCal && (
        <div className="mt-3 flex justify-center rounded-xl border border-neutral-200 p-2">
          <DateRangeCalendar range={range} onChange={setRange} disabled={disabled} />
        </div>
      )}

      <Button onClick={reserve} variant="dark" size="lg" className="mt-4 w-full">
        {breakdown ? "Reserve" : "Check availability"}
      </Button>

      <p className="mt-3 text-center text-sm text-muted">
        You won&apos;t be charged yet
      </p>

      {breakdown && breakdown.nights > 0 && (
        <div className="mt-5 border-t border-neutral-200 pt-5">
          <PriceBreakdownRows breakdown={breakdown} />
        </div>
      )}
    </div>
  );
}
