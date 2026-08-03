"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import {
  X,
  ShieldCheck,
  Zap,
  Flame,
  Tag,
  Users2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { computePricing, type PricingInput } from "@/lib/pricing";
import { useCurrency } from "@/lib/currency";
import { cancellationLabel, deterministicInt } from "@/lib/listing-meta";
import { cn } from "@/lib/utils";

export type { DateRange };

type QuickSelect = {
  key: string;
  label: string;
  range: (today: Date) => DateRange;
};

const QUICK_SELECTS: QuickSelect[] = [
  {
    key: "weekend",
    label: "This weekend",
    range: (today) => {
      const offset = (5 - today.getDay() + 7) % 7; // days until Friday (0 if today)
      const from = addDays(today, offset);
      return { from, to: addDays(from, 2) };
    },
  },
  {
    key: "3nights",
    label: "3 nights",
    range: (today) => ({ from: addDays(today, 1), to: addDays(today, 4) }),
  },
  {
    key: "1week",
    label: "1 week",
    range: (today) => ({ from: addDays(today, 1), to: addDays(today, 8) }),
  },
  {
    key: "2weeks",
    label: "2 weeks",
    range: (today) => ({ from: addDays(today, 1), to: addDays(today, 15) }),
  },
];

const rdpClassNames = {
  months: "flex flex-col gap-8 sm:flex-row sm:gap-10",
  month: "w-full",
  month_caption:
    "sticky top-0 z-[5] mb-2 flex items-center justify-center bg-surface py-2 font-display text-[15px] font-semibold text-ink",
  nav: "gap-1",
  button_previous:
    "flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-surface text-ink transition-colors hover:border-ink hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-30",
  button_next:
    "flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-surface text-ink transition-colors hover:border-ink hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-30",
  month_grid: "w-full border-collapse",
  weekday: "pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted",
  day: "p-0.5 text-center align-middle",
  day_button:
    "mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium text-ink transition-colors duration-150 hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:pointer-events-none disabled:text-neutral-300 disabled:line-through disabled:hover:bg-transparent",
  today: "[&>button]:font-bold [&>button]:text-brand [&>button]:ring-1 [&>button]:ring-inset [&>button]:ring-accent-dark/60",
  selected: "[&>button]:bg-brand [&>button]:text-white [&>button]:hover:bg-brand-dark",
  range_start:
    "rounded-l-full bg-accent-soft/70 [&>button]:bg-brand [&>button]:text-white [&>button]:hover:bg-brand-dark",
  range_end:
    "rounded-r-full bg-accent-soft/70 [&>button]:bg-brand [&>button]:text-white [&>button]:hover:bg-brand-dark",
  range_middle:
    "bg-accent-soft/70 [&>button]:rounded-full [&>button]:bg-transparent [&>button]:text-ink [&>button]:hover:bg-accent",
  outside: "[&>button]:text-neutral-300 [&>button]:hover:bg-transparent",
  hidden: "invisible",
};

export function PremiumDatePicker({
  open,
  onClose,
  range,
  onChange,
  onContinue,
  disabledRanges,
  pricing,
  taxLabel = "Taxes",
  minNights = 1,
  availability,
  cancellationPolicy,
  seed,
}: {
  open: boolean;
  onClose: () => void;
  range: DateRange | undefined;
  onChange: (r: DateRange | undefined) => void;
  onContinue: () => void;
  disabledRanges?: { from: Date; to: Date }[];
  pricing: PricingInput;
  taxLabel?: string;
  minNights?: number;
  availability?: { avail: number; total: number } | null;
  cancellationPolicy?: string | null;
  seed: string;
}) {
  const { format: money } = useCurrency();
  const [render, setRender] = React.useState(open);
  const [visible, setVisible] = React.useState(false);
  const [prevOpen, setPrevOpen] = React.useState(open);
  const [months, setMonths] = React.useState(1);

  // Sync internal transition state to the `open` prop. Adjusting state
  // during render (guarded on the previous prop value) instead of in an
  // effect, per https://react.dev/learn/you-might-not-need-an-effect.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setRender(true);
    else setVisible(false);
  }

  const close = React.useCallback(() => {
    setVisible(false);
    onClose();
  }, [onClose]);

  React.useEffect(() => {
    if (!render) return;
    // A timer (not requestAnimationFrame) so the enter transition still
    // triggers reliably in backgrounded/inactive tabs, where rAF is
    // throttled to a near-standstill.
    const id = setTimeout(() => setVisible(true), 16);
    return () => clearTimeout(id);
  }, [render]);

  // Tracks whether the enter transition has actually completed at least
  // once, so the fallback below only ever arms on a real close — never
  // during the opening race, before `visible` has had its first chance to
  // flip true.
  const wasVisible = React.useRef(false);
  React.useEffect(() => {
    if (visible) {
      wasVisible.current = true;
      return;
    }
    if (!render || !wasVisible.current) return;
    // Fallback unmount independent of onTransitionEnd — a throttled tab or a
    // transition that never fires its end event must not leave an invisible,
    // click-blocking overlay stuck over the page.
    const id = setTimeout(() => {
      wasVisible.current = false;
      setRender(false);
    }, 250);
    return () => clearTimeout(id);
  }, [render, visible]);

  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setMonths(mq.matches ? 2 : 1);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  React.useEffect(() => {
    if (!render) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [render, close]);

  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const nights =
    range?.from && range?.to
      ? Math.max(0, differenceInCalendarDays(range.to, range.from))
      : 0;
  // react-day-picker sets `to === from` on the first click of a range
  // selection — treat that as "checkout not chosen yet", matching the same
  // 0-night guard the booking sidebar itself already relies on.
  const hasCheckout = nights > 0;
  const breakdown =
    nights > 0 ? computePricing(pricing, range!.from!, range!.to!) : null;
  const belowMinStay = nights > 0 && nights < minNights;
  const canContinue = nights > 0 && !belowMinStay;

  const phase = !range?.from ? "checkin" : !hasCheckout ? "checkout" : "done";
  const phaseLabel =
    phase === "checkin"
      ? "Choose your check-in date"
      : phase === "checkout"
        ? "Choose your check-out date"
        : `${nights} night${nights === 1 ? "" : "s"} selected`;

  const recentBookings = deterministicInt(seed + "recent", 3, 24);

  if (!render) return null;

  return createPortal(
    <div
      onClick={close}
      onTransitionEnd={() => {
        if (!visible) setRender(false);
      }}
      className={cn(
        "fixed inset-0 z-[65] flex items-center justify-center p-3 backdrop-blur-md transition-opacity duration-200 ease-out sm:p-6",
        visible ? "bg-black/45 opacity-100" : "pointer-events-none bg-black/0 opacity-0"
      )}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="date-picker-title"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "flex max-h-[90vh] w-full max-w-[940px] flex-col overflow-hidden rounded-2xl border border-hairline bg-surface shadow-pop transition-all duration-200 ease-out",
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "-translate-y-2 scale-[0.98] opacity-0"
        )}
      >
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-hairline bg-surface/95 px-5 py-4 backdrop-blur">
          <div>
            <h2
              id="date-picker-title"
              className="font-display text-xl font-semibold text-ink"
            >
              Select your dates
            </h2>
            <p className="mt-0.5 text-xs font-medium text-muted">
              {phaseLabel}
            </p>
          </div>
          <button
            onClick={close}
            aria-label="Close date picker"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-neutral-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Quick select */}
          <div
            className="no-scrollbar flex gap-2 overflow-x-auto border-b border-hairline px-5 py-3"
            role="group"
            aria-label="Quick date selection"
          >
            {QUICK_SELECTS.map((q) => (
              <button
                key={q.key}
                onClick={() => onChange(q.range(today))}
                className="shrink-0 rounded-full border border-hairline px-3.5 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-ink hover:bg-neutral-50"
              >
                {q.label}
              </button>
            ))}
            <button
              onClick={() => onChange(undefined)}
              className="shrink-0 rounded-full border border-dashed border-hairline px-3.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-ink hover:text-ink"
            >
              Flexible dates
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 px-5 py-5 lg:grid-cols-[1fr_300px]">
            <div>
              {/* Check-in / Check-out pills */}
              <div className="mb-4 grid grid-cols-2 overflow-hidden rounded-xl border border-hairline">
                <button
                  onClick={() => onChange(undefined)}
                  className={cn(
                    "border-r border-hairline px-3.5 py-2.5 text-left transition-colors",
                    phase === "checkin" ? "bg-accent-soft/60" : "hover:bg-neutral-50"
                  )}
                >
                  <span className="block text-[10px] font-bold uppercase text-ink">
                    Check-in
                  </span>
                  <span
                    className={cn(
                      "text-sm",
                      range?.from ? "text-ink" : "text-muted"
                    )}
                  >
                    {range?.from ? format(range.from, "MMM d, yyyy") : "Add date"}
                  </span>
                </button>
                <button
                  onClick={() =>
                    range?.from && onChange({ from: range.from, to: undefined })
                  }
                  disabled={!range?.from}
                  className={cn(
                    "px-3.5 py-2.5 text-left transition-colors disabled:cursor-not-allowed",
                    phase === "checkout" ? "bg-accent-soft/60" : "hover:bg-neutral-50"
                  )}
                >
                  <span className="block text-[10px] font-bold uppercase text-ink">
                    Check-out
                  </span>
                  <span
                    className={cn(
                      "text-sm",
                      hasCheckout ? "text-ink" : "text-muted"
                    )}
                  >
                    {hasCheckout ? format(range!.to!, "MMM d, yyyy") : "Add date"}
                  </span>
                </button>
              </div>

              <DayPicker
                mode="range"
                numberOfMonths={months}
                selected={range}
                onSelect={onChange}
                disabled={[{ before: today }, ...(disabledRanges ?? [])]}
                excludeDisabled
                classNames={rdpClassNames}
                style={{ ["--rdp-accent-color" as string]: "var(--color-brand)" }}
              />

              {belowMinStay && (
                <p
                  role="alert"
                  className="mt-4 rounded-lg bg-accent-soft px-3.5 py-2.5 text-sm font-medium text-accent-dark"
                >
                  This room requires a minimum stay of {minNights} nights.
                </p>
              )}

              <div className="mt-5 flex items-center gap-1.5 rounded-lg bg-neutral-50 px-3.5 py-2.5 text-xs text-muted">
                <Flame className="h-3.5 w-3.5 shrink-0 text-brand" />
                Booked {recentBookings} times this month — dates fill up fast.
              </div>
            </div>

            {/* Booking summary */}
            <div className="space-y-4">
              <div className="rounded-xl border border-hairline bg-surface p-4 shadow-card">
                <h3 className="text-sm font-bold text-ink">Trip summary</h3>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-muted">
                      Check-in
                    </span>
                    <span className="text-ink">
                      {range?.from ? format(range.from, "MMM d") : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-muted">
                      Check-out
                    </span>
                    <span className="text-ink">
                      {hasCheckout ? format(range!.to!, "MMM d") : "—"}
                    </span>
                  </div>
                </div>

                <div className="mt-3 border-t border-hairline pt-3 text-sm text-ink">
                  {breakdown && breakdown.nights > 0 ? (
                    <div className="space-y-2">
                      <Row
                        label={`${money(breakdown.nightlyRate)} × ${breakdown.nights} ${breakdown.nights === 1 ? "night" : "nights"}`}
                        value={money(breakdown.nightlyTotal)}
                      />
                      {breakdown.cleaningFee > 0 && (
                        <Row
                          label="Cleaning fee"
                          value={money(breakdown.cleaningFee)}
                        />
                      )}
                      <Row
                        label="Wanderstay service fee"
                        value={money(breakdown.serviceFee)}
                      />
                      {breakdown.tax > 0 && (
                        <Row label={taxLabel} value={money(breakdown.tax)} />
                      )}
                      <div className="flex items-center justify-between border-t border-hairline pt-2 font-bold">
                        <span>Estimated total</span>
                        <span>{money(breakdown.total)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted">
                      Select your dates to see pricing.
                    </p>
                  )}
                </div>

                {availability && nights > 0 && (
                  <p
                    className={cn(
                      "mt-3 inline-flex items-center gap-1.5 text-xs font-semibold",
                      availability.avail === 0
                        ? "text-muted"
                        : availability.avail <= 2
                          ? "text-brand"
                          : "text-green-600"
                    )}
                  >
                    <Users2 className="h-3.5 w-3.5" />
                    {availability.avail === 0
                      ? "Sold out for these dates"
                      : `${availability.avail} of ${availability.total} rooms left`}
                  </p>
                )}
              </div>

              <ul className="space-y-2 text-xs text-ink">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-accent-dark" />
                  {cancellationLabel(cancellationPolicy)}
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="h-4 w-4 shrink-0 text-accent-dark" />
                  Instant confirmation — no waiting for approval
                </li>
                <li className="flex items-center gap-2">
                  <Tag className="h-4 w-4 shrink-0 text-accent-dark" />
                  Lowest price in 30 days
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-hairline bg-surface px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-ink">
              <p>
                <span className="font-semibold">Check-in:</span>{" "}
                {range?.from ? format(range.from, "MMM d, yyyy") : "—"}
                <span className="mx-2 text-muted">·</span>
                <span className="font-semibold">Check-out:</span>{" "}
                {hasCheckout ? format(range!.to!, "MMM d, yyyy") : "—"}
              </p>
              <p className="text-muted">
                {nights > 0
                  ? `Total nights: ${nights}`
                  : "Select your check-in and check-out dates"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onChange(undefined)}
                className="rounded-lg border border-hairline px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink"
              >
                Clear dates
              </button>
              <Button
                onClick={onContinue}
                variant="dark"
                disabled={!canContinue}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span>{value}</span>
    </div>
  );
}
