import type { Metadata } from "next";
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

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SP>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const type = typeof sp.type === "string" ? sp.type : "";
  const what = type ? `${type.charAt(0).toUpperCase()}${type.slice(1)}s` : "Stays";
  const where = q ? ` in ${q}` : "";
  const title = `${what}${where} · Wanderstay`;
  return {
    title,
    description: `Browse ${what.toLowerCase()}${where} — a considered collection of places to stay on Wanderstay.`,
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
      <section className="sticky top-[4.5rem] z-30 border-b border-hairline bg-canvas/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-1">
            <div className="min-w-0 flex-1">
              <CategoryRow query={query} />
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <SortSelect query={query} />
              <SearchFilters query={query} />
            </div>
          </div>
          <div className="pb-3.5 pt-1.5">
            <FilterChips query={query} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-baseline justify-between">
          <div>
            <p className="overline-sm text-accent-dark">The Collection</p>
            <h1 className="mt-2 font-display text-3xl text-ink">{heading}</h1>
          </div>
          <p className="overline-sm text-muted">
            {listings.length} {listings.length === 1 ? "residence" : "residences"}
          </p>
        </div>

        {listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-sm border border-hairline py-24 text-center">
            <SearchX className="mb-4 h-9 w-9 text-muted" strokeWidth={1.5} />
            <p className="font-display text-2xl text-ink">No residences found</p>
            <p className="mt-2 max-w-sm text-sm text-muted">
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
