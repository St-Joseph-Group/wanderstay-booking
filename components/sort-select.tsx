"use client";

import { useRouter } from "next/navigation";

const OPTIONS = [
  { value: "featured", label: "Sort: Featured" },
  { value: "best_match", label: "Best Match" },
  { value: "rating", label: "Top rated" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "distance", label: "Distance" },
];

const NOTE: Record<string, string> = {
  best_match: "Ranked by rating, reviews, value & Superhost status.",
  distance: "Closest to your searched destination first.",
  rating: "Highest guest ratings first.",
};

export function SortSelect({ query }: { query: string }) {
  const router = useRouter();
  const params = new URLSearchParams(query);
  const current = params.get("sort") ?? "featured";

  function onChange(value: string) {
    const p = new URLSearchParams(query);
    if (value === "featured") p.delete("sort");
    else p.set("sort", value);
    router.push(`/search?${p.toString()}`);
  }

  return (
    <div className="relative">
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm font-semibold text-ink focus:border-ink focus:outline-none"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {NOTE[current] && (
        <p className="pointer-events-none absolute right-0 top-full z-20 mt-1 w-56 rounded-md border border-line bg-surface px-2.5 py-1.5 text-[11px] leading-snug text-muted shadow-pop">
          {NOTE[current]}
        </p>
      )}
    </div>
  );
}
