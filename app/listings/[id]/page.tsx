import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Star, MapPin, Users, BedDouble, Bath, DoorOpen, Share, Heart } from "lucide-react";
import { PhotoGallery } from "@/components/photo-gallery";
import { RoomSelection } from "@/components/room-selection";
import { ListingMap } from "@/components/listing-map";
import { Avatar } from "@/components/avatar";
import { StarRating } from "@/components/star-rating";
import { getListingById, getUserFavoriteIds } from "@/lib/queries";
import { getSessionProfile } from "@/lib/auth";
import { AMENITY_ICONS, PROPERTY_TYPE_LABELS } from "@/lib/constants";

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

  const hostSince = listing.host?.created_at
    ? format(parseISO(listing.host.created_at), "yyyy")
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">{listing.title}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <StarRating rating={listing.rating} reviewCount={listing.reviewCount} />
          <span className="text-muted">·</span>
          <span className="inline-flex items-center gap-1 font-medium text-ink underline">
            <MapPin className="h-3.5 w-3.5" />
            {listing.city}, {listing.country}
          </span>
          <div className="ml-auto hidden items-center gap-4 sm:flex">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink underline">
              <Share className="h-4 w-4" /> Share
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink underline">
              <Heart className="h-4 w-4" /> Save
            </span>
          </div>
        </div>
      </div>

      <PhotoGallery photos={listing.photos} title={listing.title} />

      {/* Body */}
      <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-6">
            <div>
              <h2 className="text-xl font-bold text-ink">
                {PROPERTY_TYPE_LABELS[listing.property_type]} hosted by{" "}
                {listing.host?.full_name ?? "a host"}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                {facts.map((f, i) => (
                  <span key={f.label} className="inline-flex items-center gap-1.5">
                    {i > 0 && <span className="mr-1">·</span>}
                    {f.label}
                  </span>
                ))}
              </div>
            </div>
            <Avatar
              name={listing.host?.full_name}
              src={listing.host?.avatar_url}
              size={56}
            />
          </div>

          {/* Facts grid */}
          <div className="grid grid-cols-2 gap-4 border-b border-neutral-200 py-6 sm:grid-cols-4">
            {facts.map((f) => (
              <div key={f.label} className="flex items-center gap-2">
                <f.icon className="h-5 w-5 text-ink" />
                <span className="text-sm text-ink">{f.label}</span>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="border-b border-neutral-200 py-6">
            <p className="whitespace-pre-line leading-relaxed text-ink">
              {listing.description}
            </p>
          </div>

          {/* Amenities */}
          <div className="border-b border-neutral-200 py-6">
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
          </div>

          {/* Location / map */}
          <div className="py-6">
            <h2 className="mb-1 text-xl font-bold text-ink">Where you&apos;ll be</h2>
            <p className="mb-4 text-sm text-muted">
              {listing.city}, {listing.country}
            </p>
            <ListingMap
              lat={listing.lat}
              lng={listing.lng}
              label={`${listing.city}, ${listing.country}`}
            />
          </div>
        </div>

        {/* Sticky room selection */}
        <div className="lg:relative">
          <div className="lg:sticky lg:top-24">
            <RoomSelection
              listingId={listing.id}
              roomTypes={listing.roomTypes}
              rating={listing.rating}
              reviewCount={listing.reviewCount}
              isAuthed={!!session}
            />
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="border-t border-neutral-200 py-8">
        <h2 className="mb-6 inline-flex items-center gap-2 text-xl font-bold text-ink">
          <Star className="h-5 w-5 fill-current" />
          {listing.rating ? listing.rating.toFixed(2) : "New"} ·{" "}
          {listing.reviewCount} review{listing.reviewCount === 1 ? "" : "s"}
        </h2>
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
                        i < r.rating ? "fill-ink text-ink" : "text-neutral-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-2 leading-relaxed text-ink">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {hostSince && (
        <p className="pb-8 text-sm text-muted">
          Hosted by {listing.host?.full_name} · Joined in {hostSince}
        </p>
      )}
    </div>
  );
}
