"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { StarRating } from "@/components/star-rating";
import { FavoriteButton } from "@/components/favorite-button";
import { useCurrency } from "@/lib/currency";
import type { ListingCardData } from "@/lib/queries";

const FALLBACK =
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1600&q=80";

// Editorial "spread" — a wide feature with the image on one side and a
// typographic panel on the other. Breaks the uniform grid on the home page.
export function FeaturedListing({
  listing,
  isFavorited = false,
  isAuthed = false,
}: {
  listing: ListingCardData;
  isFavorited?: boolean;
  isAuthed?: boolean;
}) {
  const { format } = useCurrency();
  const photo = listing.photos[0] ?? FALLBACK;
  const area = listing.address?.split(",")[0]?.trim() || listing.city;

  return (
    <div className="group grid overflow-hidden rounded-2xl border border-hairline bg-surface shadow-card lg:grid-cols-[1.4fr_1fr]">
      <div className="relative aspect-[16/10] overflow-hidden lg:aspect-auto">
        <Image
          src={photo}
          alt={listing.title}
          fill
          sizes="(max-width: 1024px) 100vw, 55vw"
          className="object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.04]"
          priority
        />
        <FavoriteButton
          listingId={listing.id}
          initial={isFavorited}
          isAuthed={isAuthed}
        />
      </div>

      <div className="flex flex-col justify-center gap-4 p-8 lg:p-12">
        <div className="flex items-center justify-between gap-3">
          <p className="overline-sm text-accent-dark">Featured residence</p>
          <StarRating
            rating={listing.rating}
            reviewCount={listing.reviewCount}
          />
        </div>
        <p className="overline-sm text-muted">
          {listing.city} · {listing.country}
        </p>
        <h3 className="font-display text-3xl leading-tight text-ink">
          {listing.title}
        </h3>
        <p className="text-sm text-muted">{area}</p>
        <div className="mt-2 flex items-baseline gap-1.5 border-t border-hairline pt-5">
          <span className="overline-sm text-muted">from</span>
          <span className="numeral text-2xl text-ink">
            {format(listing.price_per_night)}
          </span>
          <span className="text-sm text-muted">/ night</span>
        </div>
        <Link
          href={`/listings/${listing.id}`}
          className="group/link mt-2 inline-flex items-center gap-2 text-ink transition-colors hover:text-accent-dark"
        >
          <span className="overline">View the residence</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
