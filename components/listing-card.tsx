"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { StarRating } from "@/components/star-rating";
import { FavoriteButton } from "@/components/favorite-button";
import { listingBadges, socialProof, type Badge } from "@/lib/listing-meta";
import { useCurrency } from "@/lib/currency";
import type { ListingCardData } from "@/lib/queries";
import { cn } from "@/lib/utils";

const toneClass: Record<Badge["tone"], string> = {
  accent: "bg-accent text-ink",
  dark: "bg-brand text-white",
  soft: "bg-white/90 text-ink ring-1 ring-black/5",
};

export function ListingCard({
  listing,
  isFavorited = false,
  isAuthed = false,
  priority = false,
}: {
  listing: ListingCardData;
  isFavorited?: boolean;
  isAuthed?: boolean;
  priority?: boolean;
}) {
  const { format } = useCurrency();
  const photos = listing.photos.length
    ? listing.photos
    : ["https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80"];
  const [idx, setIdx] = React.useState(0);

  const go = (e: React.MouseEvent, dir: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIdx((i) => (i + dir + photos.length) % photos.length);
  };

  const badges = listingBadges(listing);
  const area = listing.address?.split(",")[0]?.trim() || listing.city;
  const drop =
    listing.priceAtSave != null &&
    listing.price_per_night < listing.priceAtSave
      ? listing.priceAtSave - listing.price_per_night
      : null;

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block overflow-hidden rounded-lg border border-line bg-surface shadow-card transition-shadow hover:shadow-float"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
        <Image
          src={photos[idx]}
          alt={listing.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          priority={priority}
        />
        {/* Luxury gradient + property-type overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/10" />
        <span className="pointer-events-none absolute bottom-2.5 left-3 text-[11px] font-semibold uppercase tracking-wider text-white/95">
          {listing.property_type}
        </span>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="absolute left-3 top-3 flex max-w-[75%] flex-wrap gap-1.5">
            {badges.map((b) => (
              <span
                key={b.label}
                className={cn(
                  "rounded-md px-2 py-0.5 text-[11px] font-semibold shadow-sm",
                  toneClass[b.tone]
                )}
              >
                {b.label}
              </span>
            ))}
          </div>
        )}

        <FavoriteButton
          listingId={listing.id}
          initial={isFavorited}
          isAuthed={isAuthed}
        />

        {photos.length > 1 && (
          <>
            <button
              onClick={(e) => go(e, -1)}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/90 p-1.5 shadow hover:bg-white group-hover:block"
            >
              <ChevronLeft className="h-4 w-4 text-ink" />
            </button>
            <button
              onClick={(e) => go(e, 1)}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/90 p-1.5 shadow hover:bg-white group-hover:block"
            >
              <ChevronRight className="h-4 w-4 text-ink" />
            </button>
            <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
              {photos.slice(0, 5).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full bg-white transition-opacity",
                    i === idx ? "opacity-100" : "opacity-60"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold text-ink">
            {listing.city}, {listing.country}
          </h3>
          <StarRating
            rating={listing.rating}
            reviewCount={listing.reviewCount}
            showCount
          />
        </div>
        <p className="line-clamp-1 text-sm text-muted">{listing.title}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="line-clamp-1">{area}</span>
        </p>
        <p className="mt-1.5 text-[11px] font-semibold text-accent-dark">
          {socialProof(listing.id)}
        </p>
        <p className="mt-2 flex items-baseline gap-1.5 text-ink">
          <span className="font-display text-lg font-semibold">
            {format(listing.price_per_night)}
          </span>
          <span className="text-sm text-muted">night</span>
          {drop != null && (
            <span className="ml-auto rounded-md bg-accent-soft px-1.5 py-0.5 text-[11px] font-semibold text-accent-dark">
              ↓ {format(drop)} since saved
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
