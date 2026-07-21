import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  Star,
  MapPin,
  Users,
  BedDouble,
  Bath,
  DoorOpen,
  Check,
  ShieldCheck,
  Quote,
} from "lucide-react";
import { PhotoGallery } from "@/components/photo-gallery";
import { RoomSelection } from "@/components/room-selection";
import { ListingMap } from "@/components/listing-map";
import { Avatar } from "@/components/avatar";
import { StarRating } from "@/components/star-rating";
import { RecordView } from "@/components/record-view";
import { PropertyScore } from "@/components/property-score";
import { HostCard } from "@/components/host-card";
import { ShareSave } from "@/components/share-save";
import { SectionNav } from "@/components/section-nav";
import { getListingById, getUserFavoriteIds } from "@/lib/queries";
import { getSessionProfile } from "@/lib/auth";
import { AMENITY_ICONS, PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { cancellationLabel, deterministicInt } from "@/lib/listing-meta";
import { findDestination } from "@/lib/destinations";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "features", label: "Key features" },
  { id: "amenities", label: "Amenities" },
  { id: "location", label: "Location" },
  { id: "reviews", label: "Reviews" },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) return { title: "Listing not found · Wanderstay" };

  const title = `${listing.title} — ${listing.city}, ${listing.country} · Wanderstay`;
  const description =
    listing.description?.replace(/\s+/g, " ").trim().slice(0, 155) ||
    `Stay at ${listing.title} in ${listing.city}, ${listing.country}.`;
  const image = listing.photos[0];

  return {
    title,
    description,
    alternates: { canonical: `/listings/${id}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [listing, favorites, session] = await Promise.all([
    getListingById(id),
    getUserFavoriteIds(),
    getSessionProfile(),
  ]);

  if (!listing) notFound();

  const facts = [
    { icon: Users, label: `${listing.max_guests} guests` },
    { icon: DoorOpen, label: `${listing.bedrooms} bedroom${listing.bedrooms === 1 ? "" : "s"}` },
    { icon: BedDouble, label: `${listing.beds} bed${listing.beds === 1 ? "" : "s"}` },
    { icon: Bath, label: `${listing.bathrooms} bath${listing.bathrooms === 1 ? "" : "s"}` },
  ];

  const standout = ["Pool", "Beach access", "Hot tub", "Fireplace"].find((a) =>
    listing.amenities.includes(a)
  );
  const overlayHeadline = `${PROPERTY_TYPE_LABELS[listing.property_type]}${
    standout ? ` · ${standout}` : ""
  }`;

  const keyFeatures = [
    listing.isSuperhost ? "Superhost-quality stay" : null,
    `Sleeps up to ${listing.max_guests}`,
    `${listing.bedrooms} bedroom${listing.bedrooms === 1 ? "" : "s"} · ${listing.beds} bed${listing.beds === 1 ? "" : "s"}`,
    ...listing.amenities.slice(0, 3),
  ].filter(Boolean) as string[];

  const dest = findDestination(listing.city);
  const landmarks =
    dest?.landmarks ?? [
      { name: "Beach", minutes: deterministicInt(listing.id + "beach", 3, 12) },
      { name: "City center", minutes: deterministicInt(listing.id + "ctr", 8, 20) },
      { name: "Airport", minutes: deterministicInt(listing.id + "air", 25, 50) },
    ];
  const locationSummary = dest
    ? dest.tagline
    : `Well-placed for exploring the best of ${listing.city}.`;

  const highlights = [...listing.reviewsFull]
    .filter((r) => r.comment && r.comment.length > 60)
    .sort((a, b) => b.comment.length - a.comment.length)
    .slice(0, 2);

  // schema.org structured data for rich search results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: listing.title,
    description: listing.description,
    image: listing.photos,
    address: {
      "@type": "PostalAddress",
      addressLocality: listing.city,
      addressCountry: listing.country,
      ...(listing.address ? { streetAddress: listing.address } : {}),
    },
    ...(listing.lat != null && listing.lng != null
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: listing.lat,
            longitude: listing.lng,
          },
        }
      : {}),
    priceRange: `From $${Math.round(listing.price_per_night / 100)} per night`,
    ...(listing.rating != null && listing.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: listing.rating,
            reviewCount: listing.reviewCount,
            bestRating: 5,
          },
        }
      : {}),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RecordView
        item={{
          id: listing.id,
          title: listing.title,
          city: listing.city,
          country: listing.country,
          price: listing.price_per_night,
          photo: listing.photos[0] ?? null,
        }}
      />

      {/* Title */}
      <div className="mb-5">
        <p className="overline-sm text-accent-dark">
          {listing.city} · {listing.country}
        </p>
        <h1 className="mt-2 font-display text-3xl leading-tight text-ink sm:text-4xl">
          {listing.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
          <StarRating rating={listing.rating} reviewCount={listing.reviewCount} />
          <span className="inline-flex items-center gap-1.5 text-muted">
            <MapPin className="h-3.5 w-3.5" />
            {listing.city}, {listing.country}
          </span>
          <span className="overline-sm inline-flex items-center gap-1.5 text-accent-dark">
            <ShieldCheck className="h-3.5 w-3.5" />
            {cancellationLabel(listing.cancellation_policy)}
          </span>
          <ShareSave
            listingId={listing.id}
            title={listing.title}
            initialSaved={favorites.has(listing.id)}
            isAuthed={!!session}
          />
        </div>
      </div>

      <PhotoGallery
        photos={listing.photos}
        title={listing.title}
        headline={overlayHeadline}
      />

      {/* In-page section nav */}
      <SectionNav sections={SECTIONS} />

      {/* Body */}
      <div className="mt-6 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          {/* Overview */}
          <section id="overview" className="scroll-mt-32 border-b border-hairline pb-8">
            <HostCard host={listing.host} />
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {facts.map((f) => (
                <div key={f.label} className="flex items-center gap-2">
                  <f.icon className="h-5 w-5 text-ink" />
                  <span className="text-sm text-ink">{f.label}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 whitespace-pre-line leading-relaxed text-ink">
              {listing.description}
            </p>
          </section>

          {/* Key features */}
          <section id="features" className="scroll-mt-32 border-b border-hairline py-8">
            <h2 className="mb-5 font-display text-2xl text-ink">Key features</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {keyFeatures.map((f) => (
                <div key={f} className="flex items-center gap-3 border-b border-hairline/70 pb-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-hairline text-accent-dark">
                    <Check className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </span>
                  <span className="text-ink">{f}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Amenities */}
          <section id="amenities" className="scroll-mt-32 border-b border-hairline py-8">
            <h2 className="mb-5 font-display text-2xl text-ink">
              What this place offers
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {listing.amenities.map((a) => {
                const Icon = AMENITY_ICONS[a];
                return (
                  <div key={a} className="flex items-center gap-3">
                    {Icon ? (
                      <Icon className="h-5 w-5 text-ink" />
                    ) : (
                      <span className="h-5 w-5" />
                    )}
                    <span className="text-ink">{a}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Location */}
          <section id="location" className="scroll-mt-32 py-8">
            <h2 className="mb-1 font-display text-2xl text-ink">
              Where you&apos;ll be
            </h2>
            <p className="mb-4 text-sm text-muted">
              {listing.city}, {listing.country}
            </p>
            <ListingMap
              lat={listing.lat}
              lng={listing.lng}
              label={`${listing.city}, ${listing.country}`}
              landmarks={landmarks}
              summary={locationSummary}
            />
          </section>
        </div>

        {/* Sticky sidebar */}
        <div className="lg:relative">
          <div className="space-y-5 lg:sticky lg:top-24">
            <RoomSelection
              listingId={listing.id}
              roomTypes={listing.roomTypes}
              rating={listing.rating}
              reviewCount={listing.reviewCount}
              isAuthed={!!session}
              cancellationPolicy={listing.cancellation_policy}
              country={listing.country}
            />
            <PropertyScore
              rating={listing.rating}
              subRatings={listing.subRatings}
            />
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section id="reviews" className="scroll-mt-32 border-t border-hairline py-8">
        <h2 className="mb-6 inline-flex items-baseline gap-2 font-display text-2xl text-ink">
          <span aria-hidden className="text-base text-accent">
            ◆
          </span>
          {listing.rating ? listing.rating.toFixed(2) : "New"} ·{" "}
          {listing.reviewCount} review{listing.reviewCount === 1 ? "" : "s"}
        </h2>

        {highlights.length > 0 && (
          <div className="mb-8 grid gap-5 sm:grid-cols-2">
            {highlights.map((r) => (
              <blockquote
                key={r.id}
                className="rounded-sm border border-hairline bg-surface p-6"
              >
                <Quote className="h-5 w-5 text-accent" />
                <p className="mt-3 line-clamp-4 font-display text-lg leading-relaxed text-ink">
                  {r.comment}
                </p>
                <footer className="overline-sm mt-4 text-muted">
                  — {r.author?.full_name ?? "Guest"}
                </footer>
              </blockquote>
            ))}
          </div>
        )}

        {listing.reviewsFull.length === 0 ? (
          <p className="text-muted">No reviews yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-x-12 gap-y-7 md:grid-cols-2">
            {listing.reviewsFull.map((r) => (
              <div key={r.id}>
                <div className="flex items-center gap-3">
                  <Avatar name={r.author?.full_name} src={r.author?.avatar_url} size={40} />
                  <div>
                    <p className="font-semibold text-ink">
                      {r.author?.full_name ?? "Guest"}
                    </p>
                    <p className="text-xs text-muted">
                      {format(parseISO(r.created_at), "MMMM yyyy")}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < r.rating
                          ? "fill-accent text-accent"
                          : "text-hairline"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-2 leading-relaxed text-ink">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
