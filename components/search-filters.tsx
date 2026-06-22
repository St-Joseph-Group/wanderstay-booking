"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AMENITIES, PROPERTY_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function SearchFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = React.useState(false);

  const [minPrice, setMinPrice] = React.useState(params.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = React.useState(params.get("maxPrice") ?? "");
  const [guests, setGuests] = React.useState(Number(params.get("guests") ?? 0));
  const [type, setType] = React.useState(params.get("type") ?? "");
  const [amenities, setAmenities] = React.useState<string[]>(
    params.getAll("amenity")
  );

  const activeCount =
    (params.get("minPrice") ? 1 : 0) +
    (params.get("maxPrice") ? 1 : 0) +
    (params.get("guests") ? 1 : 0) +
    (params.get("type") ? 1 : 0) +
    params.getAll("amenity").length;

  function apply() {
    const p = new URLSearchParams(params.toString());
    const set = (k: string, v: string | number | undefined) => {
      if (v) p.set(k, String(v));
      else p.delete(k);
    };
    set("minPrice", minPrice);
    set("maxPrice", maxPrice);
    set("guests", guests || "");
    set("type", type);
    p.delete("amenity");
    amenities.forEach((a) => p.append("amenity", a));
    setOpen(false);
    router.push(`/search?${p.toString()}`);
  }

  function clearAll() {
    setMinPrice("");
    setMaxPrice("");
    setGuests(0);
    setType("");
    setAmenities([]);
    const p = new URLSearchParams();
    const q = params.get("q");
    if (q) p.set("q", q);
    setOpen(false);
    router.push(`/search?${p.toString()}`);
  }

  function toggleAmenity(a: string) {
    setAmenities((cur) =>
      cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-ink hover:border-ink"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {activeCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-xs text-white">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-pop">
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-5 w-5 text-ink" />
              </button>
              <h2 className="font-bold text-ink">Filters</h2>
              <span className="w-5" />
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              <div>
                <h3 className="mb-2 font-semibold text-ink">Price range</h3>
                <p className="mb-3 text-sm text-muted">Nightly price in USD</p>
                <div className="flex items-center gap-3">
                  <PriceInput label="Min" value={minPrice} onChange={setMinPrice} />
                  <span className="text-muted">–</span>
                  <PriceInput label="Max" value={maxPrice} onChange={setMaxPrice} />
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-semibold text-ink">Guests</h3>
                <div className="flex flex-wrap gap-2">
                  {[0, 1, 2, 4, 6, 8].map((g) => (
                    <Pill
                      key={g}
                      active={guests === g}
                      onClick={() => setGuests(g)}
                    >
                      {g === 0 ? "Any" : `${g}+`}
                    </Pill>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-semibold text-ink">Property type</h3>
                <div className="flex flex-wrap gap-2">
                  <Pill active={type === ""} onClick={() => setType("")}>
                    Any
                  </Pill>
                  {PROPERTY_TYPES.map((t) => (
                    <Pill
                      key={t.value}
                      active={type === t.value}
                      onClick={() => setType(t.value)}
                    >
                      {t.label}
                    </Pill>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-semibold text-ink">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES.map((a) => (
                    <Pill
                      key={a}
                      active={amenities.includes(a)}
                      onClick={() => toggleAmenity(a)}
                    >
                      {a}
                    </Pill>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-neutral-100 px-5 py-4">
              <button
                onClick={clearAll}
                className="text-sm font-semibold text-ink underline"
              >
                Clear all
              </button>
              <Button onClick={apply}>Show results</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PriceInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex-1 rounded-xl border border-neutral-300 px-3 py-2">
      <span className="block text-xs text-muted">{label}</span>
      <div className="flex items-center">
        <span className="text-sm text-ink">$</span>
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className="w-full bg-transparent text-sm focus:outline-none"
        />
      </div>
    </label>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-2 text-sm transition-colors",
        active
          ? "border-ink bg-ink text-white"
          : "border-neutral-300 text-ink hover:border-ink"
      )}
    >
      {children}
    </button>
  );
}
