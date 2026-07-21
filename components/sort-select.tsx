"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "best_match", label: "Best Match", note: "Ranked by rating, reviews, value & Superhost status." },
  { value: "rating", label: "Top rated", note: "Highest guest ratings first." },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "distance", label: "Distance", note: "Closest to your searched destination first." },
];

export function SortSelect({ query }: { query: string }) {
  const router = useRouter();
  const params = new URLSearchParams(query);
  const current = params.get("sort") ?? "featured";
  const currentOption = OPTIONS.find((o) => o.value === current) ?? OPTIONS[0];

  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function onChange(value: string) {
    const p = new URLSearchParams(query);
    if (value === "featured") p.delete("sort");
    else p.set("sort", value);
    setOpen(false);
    router.push(`/search?${p.toString()}`);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="overline-sm flex items-center gap-2 rounded-sm border border-hairline bg-surface px-4 py-2.5 text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand/30"
      >
        <ArrowUpDown className="h-3.5 w-3.5 text-muted" />
        {currentOption.label}
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="listbox"
          className="animate-fade-in absolute right-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-sm border border-hairline bg-surface py-1.5 shadow-pop"
        >
          {OPTIONS.map((o) => {
            const active = o.value === current;
            return (
              <button
                key={o.value}
                role="option"
                aria-selected={active}
                onClick={() => onChange(o.value)}
                className={cn(
                  "flex w-full items-start justify-between gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-black/5",
                  active && "bg-accent-soft/40"
                )}
              >
                <span>
                  <span className={cn("block text-sm", active ? "font-semibold text-ink" : "text-ink")}>
                    {o.label}
                  </span>
                  {o.note && (
                    <span className="mt-0.5 block text-xs leading-snug text-muted">
                      {o.note}
                    </span>
                  )}
                </span>
                {active && <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-dark" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
