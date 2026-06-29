"use client";

import { useRouter } from "next/navigation";

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
    <select
      value={current}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-neutral-300 px-3 py-2.5 text-sm font-semibold text-ink focus:border-ink focus:outline-none"
    >
      <option value="featured">Sort: Featured</option>
      <option value="price_asc">Price: Low to High</option>
      <option value="price_desc">Price: High to Low</option>
    </select>
  );
}
