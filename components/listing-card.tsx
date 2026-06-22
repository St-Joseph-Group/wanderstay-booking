"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StarRating } from "@/components/star-rating";
import { FavoriteButton } from "@/components/favorite-button";
import { formatPriceCompact } from "@/lib/utils";
import type { ListingCardData } from "@/lib/queries";
import { cn } from "@/lib/utils";

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
  const photos = listing.photos.length
    ? listing.photos
    : ["https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80"];
  const [idx, setIdx] = React.useState(0);

  const go = (e: React.MouseEvent, dir: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIdx((i) => (i + dir + photos.length) % photos.length);
  };

  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-neutral-100">
        <Image
          src={photos[idx]}
          alt={listing.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          priority={priority}
        />
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

      <div className="mt-2.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold text-ink">
            {listing.city}, {listing.country}
          </h3>
          <StarRating
            rating={listing.rating}
            reviewCount={listing.reviewCount}
            showCount={false}
          />
        </div>
        <p className="line-clamp-1 text-sm text-muted">{listing.title}</p>
        <p className="mt-1 text-sm text-ink">
          <span className="font-semibold">
            {formatPriceCompact(listing.price_per_night)}
          </span>{" "}
          <span className="text-muted">night</span>
        </p>
      </div>
    </Link>
  );
}
