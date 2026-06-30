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

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
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
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">
          {listing.title}
        </h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <StarRating rating={listing.rating} reviewCount={listing.reviewCount} />
          <span className="text-muted">·</span>
          <span className="inline-flex items-center gap-1 font-medium text-ink">
            <MapPin className="h-3.5 w-3.5" />
            {listing.city}, {listing.country}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent-dark">
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
      <nav className="sticky top-16 z-20 -mx-4 mt-4 border-b border-line bg-canvas/95 px-4 backdrop-blur sm:mx-0 sm:px-0">
        <div className="no-scrollbar flex gap-6 overflow-x-auto">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="shrink-0 border-b-2 border-transparent py-3 text-sm font-medium text-muted hover:border-ink hover:text-ink"
            >
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Body */}
      <div className="mt-6 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          {/* Overview */}
          <section id="overview" className="scroll-mt-32 border-b border-line pb-8">
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
          <section id="features" className="scroll-mt-32 border-b border-line py-8">
            <h2 className="mb-4 text-xl font-bold text-ink">Key features</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {keyFeatures.map((f) => (
                <div key={f} className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-dark">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-ink">{f}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Amenities */}
          <section id="amenities" className="scroll-mt-32 border-b border-line py-8">
            <h2 className="mb-4 text-xl font-bold text-ink">
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
            <h2 className="mb-1 text-xl font-bold text-ink">
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
            />
            <PropertyScore
              rating={listing.rating}
              subRatings={listing.subRatings}
            />
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section id="reviews" className="scroll-mt-32 border-t border-line py-8">
        <h2 className="mb-6 inline-flex items-center gap-2 text-xl font-bold text-ink">
          <Star className="h-5 w-5 fill-accent text-accent" />
          {listing.rating ? listing.rating.toFixed(2) : "New"} ·{" "}
          {listing.reviewCount} review{listing.reviewCount === 1 ? "" : "s"}
        </h2>

        {highlights.length > 0 && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            {highlights.map((r) => (
              <blockquote
                key={r.id}
                className="rounded-lg border border-line bg-surface p-5 shadow-card"
              >
                <Quote className="h-5 w-5 text-accent" />
                <p className="mt-2 line-clamp-4 leading-relaxed text-ink">
                  {r.comment}
                </p>
                <footer className="mt-3 text-sm font-semibold text-muted">
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
                          : "text-neutral-300"
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
