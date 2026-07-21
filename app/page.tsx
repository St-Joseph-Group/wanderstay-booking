import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  ShieldCheck,
  Headset,
  Undo2,
  Lock,
  ArrowRight,
} from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { CategoryRow } from "@/components/category-row";
import { ListingCard } from "@/components/listing-card";
import { FeaturedListing } from "@/components/featured-listing";
import { RecentlyViewed } from "@/components/recently-viewed";
import { getListings, getUserFavoriteIds, pickRecommended } from "@/lib/queries";
import { getSessionProfile } from "@/lib/auth";

const trustPoints = [
  {
    icon: ShieldCheck,
    title: "Verified hosts",
    body: "Every residence is reviewed before it joins the collection.",
  },
  {
    icon: Lock,
    title: "Secure payments",
    body: "Your booking and card details stay encrypted, always.",
  },
  {
    icon: Undo2,
    title: "Free cancellation",
    body: "Flexible dates on most stays, with no fees.",
  },
  {
    icon: Headset,
    title: "24/7 concierge",
    body: "Real help, day or night, wherever you find yourself.",
  },
];

function SectionHeader({
  index,
  overline,
  title,
  description,
}: {
  index: string;
  overline: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="overline-sm text-accent-dark">
          <span className="section-index mr-2">{index}</span>
          {overline}
        </p>
        <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
          {title}
        </h2>
      </div>
      {description && (
        <p className="max-w-sm text-sm leading-relaxed text-muted">
          {description}
        </p>
      )}
    </div>
  );
}

export default async function HomePage() {
  const [listings, favorites, session] = await Promise.all([
    getListings(),
    getUserFavoriteIds(),
    getSessionProfile(),
  ]);
  const isAuthed = !!session;
  const isHost = !!session?.profile?.is_host;
  const recommended = pickRecommended(listings, favorites, 4);
  const recommendedIds = new Set(recommended.map((l) => l.id));
  const heroListing =
    listings.find((l) => !recommendedIds.has(l.id)) ?? listings[0];

  // First recommended becomes the editorial "spread"; the rest fill the grid.
  const [feature, ...restRecommended] = recommended;
  const cities = Array.from(new Set(listings.map((l) => l.city))).slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="relative border-b border-hairline">
        {heroListing && (
          <div className="absolute inset-0 -z-10">
            <Image
              src={heroListing.photos[0]}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/90 via-brand-dark/60 to-brand-dark/25" />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/50 via-transparent to-transparent" />
          </div>
        )}
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <p className="overline text-accent-soft/90">
              Wanderstay · The Collection
            </p>
            <h1 className="mt-5 font-display text-5xl leading-[1.08] text-white [text-shadow:0_2px_24px_rgba(30,24,18,0.35)] sm:text-[4.25rem]">
              Stay somewhere{" "}
              <em className="italic text-accent-soft">worth remembering</em>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/85">
              A considered collection of apartments, villas and retreats — from
              hosts who care about the details, the world over.
            </p>
          </div>

          {/* Search on its own line, then a soft secondary invitation */}
          <div className="mt-10 max-w-3xl">
            <SearchBar />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link
              href="/plan"
              className="group inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-white ring-1 ring-white/30 backdrop-blur-sm transition-colors hover:bg-white hover:text-brand-dark hover:ring-white"
            >
              <Sparkles className="h-4 w-4 text-accent-soft transition-colors group-hover:text-accent-dark" />
              <span className="text-sm font-medium">Plan my trip for me</span>
            </Link>
            <span className="text-sm text-white/70">
              Tell us your vibe — we&apos;ll build the itinerary.
            </span>
          </div>
        </div>
      </section>

      {/* Browse by type */}
      <section className="border-b border-hairline bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <CategoryRow query="" />
        </div>
      </section>

      {/* 01 — The Collection */}
      {recommended.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
          <SectionHeader
            index="01"
            overline="Curated for you"
            title="The Collection"
            description="Hand-picked residences we think match your taste — refreshed as you explore."
          />
          {feature && (
            <div className="mb-10">
              <FeaturedListing
                listing={feature}
                isFavorited={favorites.has(feature.id)}
                isAuthed={isAuthed}
              />
            </div>
          )}
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {restRecommended.map((listing, i) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isFavorited={favorites.has(listing.id)}
                isAuthed={isAuthed}
                priority={i < 3}
              />
            ))}
          </div>
        </section>
      )}

      {/* Continue where you left off (client, localStorage) */}
      <RecentlyViewed />

      {/* 02 — Popular residences */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          index="02"
          overline="Most requested"
          title="Popular residences"
          description="The stays our travellers return to, season after season."
        />
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
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
      </section>

      {/* Assurances */}
      <section className="border-y border-hairline bg-surface">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-px overflow-hidden bg-hairline sm:grid-cols-2 lg:grid-cols-4">
          {trustPoints.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-surface p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-sm border border-hairline text-accent-dark">
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <p className="mt-4 overline text-ink">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 03 — Inspiration */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          index="03"
          overline="Where to next"
          title="Destinations in focus"
        />
        <div className="divide-y divide-hairline border-y border-hairline">
          {cities.map((city, i) => (
            <Link
              key={city}
              href={`/search?q=${encodeURIComponent(city)}`}
              className="group flex items-center justify-between gap-4 py-5 transition-colors hover:bg-surface"
            >
              <div className="flex items-baseline gap-5">
                <span className="section-index w-8 text-sm">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-display text-2xl text-ink">{city}</span>
              </div>
              <span className="flex items-center gap-3 text-muted transition-colors group-hover:text-ink">
                <span className="overline-sm hidden sm:inline">
                  Explore stays
                </span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Become a host CTA */}
      <section className="bg-brand">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="max-w-xl">
            <p className="overline text-accent">Become a host</p>
            <h2 className="mt-3 font-display text-3xl text-white sm:text-4xl">
              Share your space, on your own terms
            </h2>
            <p className="mt-3 leading-relaxed text-white/75">
              Join the hosts already welcoming discerning travellers on
              Wanderstay. Set your own price, availability, and house rules.
            </p>
          </div>
          <Link
            href={isHost ? "/host" : "/host/become"}
            className="group inline-flex shrink-0 items-center gap-2 rounded-sm bg-accent px-7 py-4 text-brand-dark transition-colors hover:bg-white"
          >
            <span className="overline">
              {isHost ? "Host dashboard" : "List your home"}
            </span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </div>
  );
}
