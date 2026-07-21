"use client";

import Link from "next/link";
import Image from "next/image";
import { StarRating } from "@/components/star-rating";
import { FavoriteButton } from "@/components/favorite-button";
import { listingBadges } from "@/lib/listing-meta";
import { useCurrency } from "@/lib/currency";
import type { ListingCardData } from "@/lib/queries";
import { cn } from "@/lib/utils";

const FALLBACK =
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80";

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
  const photos = listing.photos.length ? listing.photos : [FALLBACK];
  const primary = photos[0];
  const secondary = photos[1];

  // A single quiet distinction, if any — no urgency, no stacked badges.
  const badge = listingBadges(listing)[0];
  const area = listing.address?.split(",")[0]?.trim() || listing.city;
  const drop =
    listing.priceAtSave != null && listing.price_per_night < listing.priceAtSave
      ? listing.priceAtSave - listing.price_per_night
      : null;

  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-neutral-100">
        {/* Second photo sits underneath; the primary fades away on hover to
            reveal it — a quiet editorial reveal, not a marketplace carousel. */}
        {secondary && (
          <Image
            src={secondary}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            aria-hidden
          />
        )}
        <Image
          src={primary}
          alt={listing.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={cn(
            "object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.05]",
            secondary && "crossfade-top"
          )}
          priority={priority}
        />

        {/* Quiet distinction — hairline-framed, champagne text on a bone chip */}
        {badge && (
          <span className="overline-sm absolute left-3 top-3 rounded-full bg-canvas/95 px-3 py-1 text-accent-dark shadow-sm">
            {badge.label}
          </span>
        )}

        <FavoriteButton
          listingId={listing.id}
          initial={isFavorited}
          isAuthed={isAuthed}
        />
      </div>

      {/* Gallery-label caption: location overline → property name → hairline →
          area + price. Borderless; whitespace + rules carry the structure. */}
      <div className="pt-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="overline-sm truncate text-muted">
            {listing.city} · {listing.country}
          </p>
          <StarRating
            rating={listing.rating}
            reviewCount={listing.reviewCount}
            showCount
          />
        </div>

        <h3 className="mt-1.5 line-clamp-1 font-display text-lg leading-snug text-ink">
          {listing.title}
        </h3>

        <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-hairline pt-3">
          <span className="truncate text-sm text-muted">{area}</span>
          <span className="flex shrink-0 items-baseline gap-1.5 text-ink">
            {drop != null && (
              <span className="overline-sm mr-1 text-accent-dark">
                ↓ {format(drop)}
              </span>
            )}
            <span className="overline-sm text-muted">from</span>
            <span className="numeral text-lg text-ink">
              {format(listing.price_per_night)}
            </span>
            <span className="text-xs text-muted">/ night</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
