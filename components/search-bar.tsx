"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Search, Minus, Plus } from "lucide-react";
import { DateRangeCalendar, type DateRange } from "@/components/date-range-picker";
import { cn } from "@/lib/utils";

type Panel = "where" | "dates" | "who" | null;

export function SearchBar({ variant = "hero" }: { variant?: "hero" | "compact" }) {
  const router = useRouter();
  const ref = React.useRef<HTMLDivElement>(null);
  const [panel, setPanel] = React.useState<Panel>(null);
  const [where, setWhere] = React.useState("");
  const [range, setRange] = React.useState<DateRange | undefined>();
  const [guests, setGuests] = React.useState(1);
  const [months, setMonths] = React.useState(1);

  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const update = () => setMonths(mq.matches ? 2 : 1);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setPanel(null);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function submit() {
    const params = new URLSearchParams();
    if (where.trim()) params.set("q", where.trim());
    if (range?.from) params.set("checkin", format(range.from, "yyyy-MM-dd"));
    if (range?.to) params.set("checkout", format(range.to, "yyyy-MM-dd"));
    if (guests > 1) params.set("guests", String(guests));
    setPanel(null);
    router.push(`/search?${params.toString()}`);
  }

  const dateLabel = range?.from
    ? range.to
      ? `${format(range.from, "MMM d")} – ${format(range.to, "MMM d")}`
      : format(range.from, "MMM d")
    : "Add dates";

  return (
    <div ref={ref} className="relative w-full max-w-3xl">
      <div className="flex items-center rounded-xl border border-line bg-white shadow-float">
        <Segment
          label="Where"
          active={panel === "where"}
          onClick={() => setPanel("where")}
          className="flex-[1.4] rounded-l-xl"
        >
          <input
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            onFocus={() => setPanel("where")}
            placeholder="Search destinations"
            className="w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
          />
        </Segment>
        <Divider />
        <Segment
          label="When"
          active={panel === "dates"}
          onClick={() => setPanel("dates")}
          className="flex-1"
        >
          <span className={cn("text-sm", range?.from ? "text-ink" : "text-muted")}>
            {dateLabel}
          </span>
        </Segment>
        <Divider />
        <Segment
          label="Who"
          active={panel === "who"}
          onClick={() => setPanel("who")}
          className="flex-1"
        >
          <span className={cn("text-sm", guests > 1 ? "text-ink" : "text-muted")}>
            {guests} {guests === 1 ? "guest" : "guests"}
          </span>
        </Segment>
        <div className="px-2">
          <button
            onClick={submit}
            aria-label="Search"
            className="flex h-12 items-center gap-2 rounded-lg bg-brand px-4 font-semibold text-white hover:bg-brand-dark"
          >
            <Search className="h-5 w-5" />
            <span className="hidden pr-1 lg:block">Search</span>
          </button>
        </div>
      </div>

      {panel === "dates" && (
        <Popover className="left-1/2 max-w-[92vw] -translate-x-1/2">
          <div className="overflow-x-auto">
            <DateRangeCalendar
              range={range}
              onChange={setRange}
              numberOfMonths={months}
            />
          </div>
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => setRange(undefined)}
              className="text-sm font-semibold text-ink underline"
            >
              Clear dates
            </button>
          </div>
        </Popover>
      )}

      {panel === "who" && (
        <Popover className="right-0">
          <div className="flex items-center justify-between gap-8">
            <div>
              <p className="font-semibold text-ink">Guests</p>
              <p className="text-sm text-muted">How many people?</p>
            </div>
            <Stepper value={guests} min={1} max={16} onChange={setGuests} />
          </div>
        </Popover>
      )}
    </div>
  );
}

function Segment({
  label,
  children,
  active,
  onClick,
  className,
}: {
  label: string;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start px-5 py-3 text-left transition-colors",
        active ? "rounded-lg bg-neutral-100" : "rounded-lg hover:bg-neutral-50",
        className
      )}
    >
      <span className="text-xs font-semibold text-ink">{label}</span>
      <span className="mt-0.5 w-full">{children}</span>
    </button>
  );
}

function Divider() {
  return <span className="h-8 w-px shrink-0 bg-neutral-200" />;
}

function Popover({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "animate-fade-in absolute top-[110%] z-50 rounded-3xl border border-neutral-200 bg-white p-5 shadow-pop",
        className
      )}
    >
      {children}
    </div>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-ink disabled:opacity-40"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-6 text-center font-medium">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-ink disabled:opacity-40"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
