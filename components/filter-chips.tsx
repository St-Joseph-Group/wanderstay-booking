"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type Chip =
  | { kind: "amenity"; label: string; value: string }
  | { kind: "param"; label: string; param: string; value: string };

const CHIPS: Chip[] = [
  { kind: "param", label: "Under $150", param: "maxPrice", value: "150" },
  { kind: "param", label: "Entire place", param: "entire", value: "1" },
  { kind: "amenity", label: "Wi-Fi", value: "Wifi" },
  { kind: "amenity", label: "Aircon", value: "Air conditioning" },
  { kind: "amenity", label: "Pool", value: "Pool" },
  { kind: "amenity", label: "Beachfront", value: "Beach access" },
];

// Inline, instant-apply quick filters (no modal). Each chip toggles a URL param
// and navigates immediately so results update on click.
export function FilterChips({ query }: { query: string }) {
  const router = useRouter();
  const params = new URLSearchParams(query);

  const isActive = (c: Chip) =>
    c.kind === "amenity"
      ? params.getAll("amenity").includes(c.value)
      : params.get(c.param) === c.value;

  function toggle(c: Chip) {
    const p = new URLSearchParams(query);
    if (c.kind === "amenity") {
      const cur = p.getAll("amenity");
      p.delete("amenity");
      const next = cur.includes(c.value)
        ? cur.filter((a) => a !== c.value)
        : [...cur, c.value];
      next.forEach((a) => p.append("amenity", a));
    } else if (p.get(c.param) === c.value) {
      p.delete(c.param);
    } else {
      p.set(c.param, c.value);
    }
    router.push(`/search?${p.toString()}`);
  }

  return (
    <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
      {CHIPS.map((c) => {
        const active = isActive(c);
        return (
          <button
            key={c.label}
            onClick={() => toggle(c)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              active
                ? "border-brand bg-brand text-white"
                : "border-neutral-300 text-ink hover:border-ink"
            )}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
