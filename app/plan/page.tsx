import Link from "next/link";
import { MapPin, Compass, Coffee, Utensils, Camera, Waves } from "lucide-react";
import { getListings, getUserFavoriteIds } from "@/lib/queries";
import { getSessionProfile } from "@/lib/auth";
import { parseTripQuery } from "@/lib/plan";
import { findDestination, buildItinerary, type POI } from "@/lib/destinations";
import { PlanTripSearch } from "@/components/plan-trip-search";
import { ListingCard } from "@/components/listing-card";
import { formatPriceCompact } from "@/lib/utils";

const poiIcon: Record<POI["kind"], typeof Coffee> = {
  Beach: Waves,
  Attraction: Camera,
  Cafe: Coffee,
  Food: Utensils,
  Activity: Compass,
};

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = typeof sp.q === "string" ? sp.q : "";
  const parsed = parseTripQuery(raw);
  const dest = findDestination(parsed.place ?? raw);
  const hasQuery = !!raw;

  const [matched, favorites, session] = await Promise.all([
    hasQuery
      ? getListings({
          q: parsed.place ?? undefined,
          maxPrice: parsed.maxPrice ?? undefined,
          guests: parsed.guests ?? undefined,
          sort: "best_match",
        })
      : Promise.resolve([]),
    getUserFavoriteIds(),
    getSessionProfile(),
  ]);
  const isAuthed = !!session;
  let listings = matched;

  // Fall back to top picks if the exact query found nothing.
  let fallback = false;
  if (hasQuery && listings.length === 0) {
    listings = (await getListings({ sort: "best_match" })).slice(0, 6);
    fallback = true;
  }
  listings = listings.slice(0, 6);
  const itinerary = dest ? buildItinerary(dest, parsed.days ?? 3) : [];

  return (
    <div>
      <section className="border-b border-line bg-gradient-to-b from-accent-soft/60 to-canvas">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-dark">
            <Compass className="h-4 w-4" /> Plan my Trip
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Tell us your trip. We&apos;ll handle the rest.
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Describe where, how long, your budget and party size — we&apos;ll
            suggest stays, recommend neighborhoods, and draft a day-by-day
            itinerary.
          </p>
          <div className="mt-6">
            <PlanTripSearch initial={raw} />
          </div>
        </div>
      </section>

      {hasQuery && (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Parsed summary */}
          <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">We understood:</span>
            {parsed.place && <Chip>📍 {parsed.place}</Chip>}
            {parsed.days && <Chip>{parsed.days} days</Chip>}
            {parsed.guests && <Chip>{parsed.guests} guests</Chip>}
            {parsed.maxPrice && <Chip>under {formatPriceCompact(parsed.maxPrice * 100)}/night</Chip>}
            {!parsed.place && !parsed.days && !parsed.guests && !parsed.maxPrice && (
              <Chip>your free-text request</Chip>
            )}
          </div>

          {/* Stays */}
          <h2 className="mb-1 text-2xl font-bold text-ink">
            {dest ? `Stays in ${dest.label}` : "Suggested stays"}
          </h2>
          <p className="mb-5 text-sm text-muted">
            {fallback
              ? "No exact matches — here are our top-rated stays to consider."
              : "Matched to your budget, party size and best overall fit."}
          </p>
          {listings.length > 0 ? (
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing, i) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isFavorited={favorites.has(listing.id)}
                  isAuthed={isAuthed}
                  priority={i < 3}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted">No stays found. Try a different request.</p>
          )}

          {dest && (
            <>
              {/* Neighborhoods */}
              <h2 className="mb-1 mt-12 text-2xl font-bold text-ink">
                Where to stay in {dest.label}
              </h2>
              <p className="mb-5 text-sm text-muted">{dest.tagline}</p>
              <div className="grid gap-4 sm:grid-cols-3">
                {dest.neighborhoods.map((n) => (
                  <div
                    key={n.name}
                    className="rounded-lg border border-line bg-surface p-4 shadow-card"
                  >
                    <p className="flex items-center gap-1.5 font-semibold text-ink">
                      <MapPin className="h-4 w-4 text-accent-dark" /> {n.name}
                    </p>
                    <p className="mt-1 text-sm text-muted">{n.vibe}</p>
                  </div>
                ))}
              </div>

              {/* Itinerary */}
              <h2 className="mb-5 mt-12 text-2xl font-bold text-ink">
                Your {parsed.days ?? 3}-day itinerary
              </h2>
              <div className="space-y-5">
                {itinerary.map((d) => (
                  <div
                    key={d.day}
                    className="rounded-lg border border-line bg-surface p-5 shadow-card"
                  >
                    <p className="mb-3 font-display text-lg font-semibold text-ink">
                      Day {d.day}
                    </p>
                    <ul className="grid gap-3 sm:grid-cols-3">
                      {d.items.map((p, i) => {
                        const Icon = poiIcon[p.kind];
                        return (
                          <li key={i} className="flex gap-2.5">
                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent-dark">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span>
                              <span className="block text-sm font-semibold text-ink">
                                {p.title}
                              </span>
                              <span className="block text-xs text-muted">
                                {p.blurb}
                              </span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Local experiences */}
              <h2 className="mb-5 mt-12 text-2xl font-bold text-ink">
                Local experiences & add-ons
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {dest.experiences.map((ex) => (
                  <div
                    key={ex.name}
                    className="flex flex-col rounded-lg border border-line bg-surface p-4 shadow-card"
                  >
                    <span className="mb-1 inline-flex w-fit rounded-md bg-brand/5 px-2 py-0.5 text-[11px] font-semibold text-brand">
                      {ex.type}
                    </span>
                    <p className="font-semibold text-ink">{ex.name}</p>
                    <p className="mt-1 flex-1 text-sm text-muted">{ex.blurb}</p>
                    <p className="mt-2 text-sm font-semibold text-ink">
                      {formatPriceCompact(ex.price * 100)}{" "}
                      <span className="font-normal text-muted">/ person</span>
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {!hasQuery && (
        <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6 lg:px-8">
          <p className="text-muted">
            Try one of the examples above, or{" "}
            <Link href="/search" className="font-semibold text-brand underline">
              browse all stays
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-brand/5 px-3 py-1 font-medium text-brand">
      {children}
    </span>
  );
}
