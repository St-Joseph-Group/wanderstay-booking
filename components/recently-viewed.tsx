"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { getRecentlyViewed, type RecentItem } from "@/lib/recently-viewed";
import { formatPriceCompact } from "@/lib/utils";

export function RecentlyViewed() {
  const [items, setItems] = React.useState<RecentItem[]>([]);
  React.useEffect(() => {
    setItems(getRecentlyViewed());
  }, []);

  if (items.length < 2) return null;

  return (
    <section className="mx-auto max-w-7xl border-t border-line px-4 py-8 sm:px-6 lg:px-8">
      <h2 className="mb-4 text-xl font-bold text-ink">
        Continue where you left off
      </h2>
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-1">
        {items.map((it) => (
          <Link
            key={it.id}
            href={`/listings/${it.id}`}
            className="group flex w-64 shrink-0 gap-3 rounded-lg border border-line bg-surface p-2.5 shadow-card transition-shadow hover:shadow-float"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-neutral-100">
              {it.photo && (
                <Image
                  src={it.photo}
                  alt={it.title}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              )}
            </div>
            <div className="min-w-0">
              <p className="line-clamp-1 text-sm font-semibold text-ink">
                {it.city}, {it.country}
              </p>
              <p className="line-clamp-1 text-xs text-muted">{it.title}</p>
              <p className="mt-1 text-sm text-ink">
                <span className="font-semibold">
                  {formatPriceCompact(it.price)}
                </span>{" "}
                <span className="text-muted">night</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
