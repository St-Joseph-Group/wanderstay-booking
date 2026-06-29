import Link from "next/link";
import { SearchBar } from "@/components/search-bar";
import { CategoryRow } from "@/components/category-row";
import { ListingCard } from "@/components/listing-card";
import { getListings, getUserFavoriteIds } from "@/lib/queries";
import { getSessionProfile } from "@/lib/auth";

export default async function HomePage() {
  const [listings, favorites, session] = await Promise.all([
    getListings(),
    getUserFavoriteIds(),
    getSessionProfile(),
  ]);
  const isAuthed = !!session;

  const cities = Array.from(new Set(listings.map((l) => l.city))).slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-rose-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
              Find your next <span className="text-brand">favorite stay</span>
            </h1>
            <p className="mt-4 text-lg text-muted">
              Book unique apartments, villas, cabins and more from hosts around
              the world.
            </p>
          </div>
          <div className="mt-8 flex justify-center">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl border-b border-neutral-100 px-4 sm:px-6 lg:px-8">
        <CategoryRow query="" />
      </section>

      {/* Featured listings */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="mb-5 text-2xl font-bold text-ink">
          Popular places to stay
        </h2>
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
      </section>

      {/* Inspiration */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <h2 className="mb-5 text-2xl font-bold text-ink">
          Inspiration for your next trip
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {cities.map((city) => (
            <Link
              key={city}
              href={`/search?q=${encodeURIComponent(city)}`}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-4 transition-shadow hover:shadow-float"
            >
              <p className="font-semibold text-ink">{city}</p>
              <p className="text-sm text-muted">Explore stays</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
