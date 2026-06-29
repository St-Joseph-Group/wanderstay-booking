import { SearchX } from "lucide-react";
import { CategoryRow } from "@/components/category-row";
import { SearchFilters } from "@/components/search-filters";
import { SortSelect } from "@/components/sort-select";
import { FilterChips } from "@/components/filter-chips";
import { SearchResults } from "@/components/search-results";
import { getListings, getUserFavoriteIds, type ListingFilters } from "@/lib/queries";
import { getSessionProfile } from "@/lib/auth";
import type { PropertyType } from "@/lib/database.types";

type SP = Record<string, string | string[] | undefined>;

/** Serialize the server-side searchParams into a query string the client
 *  filter controls parse — avoids useSearchParams (and its Suspense need). */
function spToQuery(sp: SP): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (Array.isArray(v)) v.forEach((x) => usp.append(k, x));
    else if (v != null) usp.set(k, v);
  }
  return usp.toString();
}

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
    entire: str(sp.entire) === "1",
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
  const query = spToQuery(sp);

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
      <section className="sticky top-16 z-30 border-b border-line bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <div className="min-w-0 flex-1">
            <CategoryRow query={query} />
          </div>
          <div className="flex shrink-0 items-center gap-2 pb-2">
            <SortSelect query={query} />
            <SearchFilters query={query} />
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-3 sm:px-6 lg:px-8">
          <FilterChips query={query} />
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
          <SearchResults
            listings={listings}
            favoritedIds={[...favorites]}
            isAuthed={isAuthed}
          />
        )}
      </section>
    </div>
  );
}
