import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { CategoryRow } from "@/components/category-row";
import { SearchFilters } from "@/components/search-filters";
import { SortSelect } from "@/components/sort-select";
import { ListingCard } from "@/components/listing-card";
import { getListings, getUserFavoriteIds, type ListingFilters } from "@/lib/queries";
import { getSessionProfile } from "@/lib/auth";
import type { PropertyType } from "@/lib/database.types";

type SP = Record<string, string | string[] | undefined>;

function buildFilters(sp: SP): ListingFilters {
  const str = (v: string | string[] | undefined) =>
    typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;
  const num = (v: string | string[] | undefined) => {
    const n = Number(str(v));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  const amenity = sp.amenity;
  return {
    q: str(sp.q),
    type: str(sp.type) as PropertyType | undefined,
    guests: num(sp.guests),
    minPrice: num(sp.minPrice),
    maxPrice: num(sp.maxPrice),
    amenities: Array.isArray(amenity) ? amenity : amenity ? [amenity] : undefined,
    sort: str(sp.sort) as ListingFilters["sort"],
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const filters = buildFilters(sp);

  const [listings, favorites, session] = await Promise.all([
    getListings(filters),
    getUserFavoriteIds(),
    getSessionProfile(),
  ]);
  const isAuthed = !!session;

  const heading = filters.q
    ? `Stays in “${filters.q}”`
    : "Explore all stays";

  return (
    <div>
      <section className="sticky top-16 z-30 border-b border-neutral-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <div className="min-w-0 flex-1">
            <Suspense fallback={<div className="h-16" />}>
              <CategoryRow />
            </Suspense>
          </div>
          <div className="flex shrink-0 items-center gap-2 pb-2">
            <Suspense fallback={null}>
              <SortSelect />
            </Suspense>
            <Suspense fallback={null}>
              <SearchFilters />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-baseline justify-between">
          <h1 className="text-xl font-bold text-ink">{heading}</h1>
          <p className="text-sm text-muted">
            {listings.length} {listings.length === 1 ? "stay" : "stays"}
          </p>
        </div>

        {listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 py-20 text-center">
            <SearchX className="mb-3 h-10 w-10 text-muted" />
            <p className="text-lg font-semibold text-ink">No stays found</p>
            <p className="mt-1 max-w-sm text-sm text-muted">
              Try removing some filters or searching a different destination.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing, i) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isFavorited={favorites.has(listing.id)}
                isAuthed={isAuthed}
                priority={i < 4}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
