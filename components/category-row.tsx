"use client";

import Link from "next/link";
import {
  Building2,
  Home,
  Castle,
  BedDouble,
  TreePine,
  Warehouse,
  Tent,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const categories: { type: string; label: string; icon: LucideIcon }[] = [
  { type: "", label: "All", icon: Sparkles },
  { type: "apartment", label: "Apartments", icon: Building2 },
  { type: "house", label: "Houses", icon: Home },
  { type: "villa", label: "Villas", icon: Castle },
  { type: "cabin", label: "Cabins", icon: TreePine },
  { type: "loft", label: "Lofts", icon: Warehouse },
  { type: "cottage", label: "Cottages", icon: Tent },
  { type: "room", label: "Rooms", icon: BedDouble },
];

export function CategoryRow({ query }: { query: string }) {
  const params = new URLSearchParams(query);
  const active = params.get("type") ?? "";

  function hrefFor(type: string) {
    const p = new URLSearchParams(query);
    if (type) p.set("type", type);
    else p.delete("type");
    return `/search?${p.toString()}`;
  }

  return (
    <nav
      aria-label="Browse by residence type"
      className="no-scrollbar flex items-center gap-7 overflow-x-auto py-5"
    >
      {categories.map((c) => {
        const isActive = active === c.type;
        const Icon = c.icon;
        return (
          <Link
            key={c.label}
            href={hrefFor(c.type)}
            className={cn(
              "group flex min-w-fit items-center gap-2 whitespace-nowrap transition-colors",
              isActive ? "text-accent-dark" : "text-muted hover:text-ink"
            )}
          >
            <Icon
              className="h-[1.15rem] w-[1.15rem]"
              strokeWidth={isActive ? 1.75 : 1.5}
            />
            <span className="overline-sm">{c.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
