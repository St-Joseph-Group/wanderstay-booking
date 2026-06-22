"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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

export function CategoryRow() {
  const params = useSearchParams();
  const pathname = usePathname();
  const active = params.get("type") ?? "";

  function hrefFor(type: string) {
    const p = new URLSearchParams(params.toString());
    if (type) p.set("type", type);
    else p.delete("type");
    const base = pathname === "/" ? "/search" : pathname;
    return `${base}?${p.toString()}`;
  }

  return (
    <div className="no-scrollbar flex gap-7 overflow-x-auto">
      {categories.map((c) => {
        const isActive = active === c.type;
        const Icon = c.icon;
        return (
          <Link
            key={c.label}
            href={hrefFor(c.type)}
            className={cn(
              "flex min-w-fit flex-col items-center gap-2 border-b-2 pb-3 pt-1 text-xs font-medium transition-colors",
              isActive
                ? "border-ink text-ink"
                : "border-transparent text-muted hover:border-neutral-300 hover:text-ink"
            )}
          >
            <Icon className="h-6 w-6" strokeWidth={1.6} />
            {c.label}
          </Link>
        );
      })}
    </div>
  );
}
