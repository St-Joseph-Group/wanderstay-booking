import { createClient } from "@/lib/supabase/server";
import type { Listing, PropertyType } from "@/lib/database.types";

export type ListingCardData = Listing & {
  photos: string[];
  rating: number | null;
  reviewCount: number;
  isSuperhost: boolean;
  isVerifiedHost: boolean;
  isBestValue: boolean;
  priceAtSave?: number | null;
};

export type SortKey =
  | "featured"
  | "price_asc"
  | "price_desc"
  | "rating"
  | "distance"
  | "best_match";

export type ListingFilters = {
  q?: string;
  city?: string;
  type?: PropertyType;
  guests?: number;
  minPrice?: number; // dollars
  maxPrice?: number; // dollars
  amenities?: string[];
  entire?: boolean; // entire place (exclude private rooms)
  sort?: SortKey;
};

// Rough city centroids for the "distance" sort + Plan-my-Trip. Lowercased keys.
const CITY_CENTROIDS: Record<string, [number, number]> = {
  bali: [-8.4095, 115.1889],
  bangkok: [13.7563, 100.5018],
  tokyo: [35.6762, 139.6503],
  paris: [48.8566, 2.3522],
  lisbon: [38.7223, -9.1393],
  barcelona: [41.3851, 2.1734],
  "new york": [40.7128, -74.006],
  siargao: [9.8482, 126.0458],
  quezon: [13.9347, 121.6324],
  cebu: [10.3157, 123.8854],
};

function haversine(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function bestMatchScore(c: ListingCardData): number {
  const r = c.rating ?? 4.2;
  const reviews = Math.min(c.reviewCount, 60);
  return (
    r * 20 +
    reviews * 0.4 +
    (c.isSuperhost ? 6 : 0) +
    (c.isBestValue ? 4 : 0) +
    (c.isVerifiedHost ? 2 : 0)
  );
}

function aggregateRating(reviews: { rating: number }[] | null) {
  if (!reviews || reviews.length === 0)
    return { rating: null as number | null, reviewCount: 0 };
  const sum = reviews.reduce((a, r) => a + r.rating, 0);
  return {
    rating: Math.round((sum / reviews.length) * 100) / 100,
    reviewCount: reviews.length,
  };
}

function toCard(row: ListingRow): ListingCardData {
  const photos = (row.listing_photos ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((p) => p.url);
  const { rating, reviewCount } = aggregateRating(row.reviews);
  const { listing_photos: _lp, reviews: _r, host, ...listing } = row;
  return {
    ...(listing as Listing),
    photos,
    rating,
    reviewCount,
    isSuperhost: host?.is_superhost ?? false,
    isVerifiedHost: host?.is_verified ?? false,
    isBestValue: false, // computed across the result set below
  };
}

// Flag the cheapest, well-rated stays in each city as "Best Value".
function markBestValue(cards: ListingCardData[]): void {
  const byCity = new Map<string, number[]>();
  for (const c of cards) {
    const arr = byCity.get(c.city) ?? [];
    arr.push(c.price_per_night);
    byCity.set(c.city, arr);
  }
  const medianByCity = new Map<string, number>();
  for (const [city, prices] of byCity) {
    const sorted = prices.slice().sort((a, b) => a - b);
    medianByCity.set(city, sorted[Math.floor(sorted.length / 2)]);
  }
  for (const c of cards) {
    const median = medianByCity.get(c.city) ?? c.price_per_night;
    c.isBestValue =
      c.price_per_night <= median * 0.9 && (c.rating ?? 0) >= 4.5;
  }
}

type ListingRow = Listing & {
  listing_photos: { url: string; position: number }[] | null;
  reviews: { rating: number }[] | null;
  host: { is_superhost: boolean; is_verified: boolean } | null;
};

const SELECT =
  "*, listing_photos(url, position), reviews(rating), host:profiles!listings_host_id_fkey(is_superhost, is_verified)";

export async function getListings(
  filters: ListingFilters = {}
): Promise<ListingCardData[]> {
  const supabase = await createClient();
  let query = supabase
    .from("listings")
    .select(SELECT)
    .eq("status", "published");

  if (filters.city) query = query.ilike("city", filters.city);
  if (filters.type) query = query.eq("property_type", filters.type);
  if (filters.guests) query = query.gte("max_guests", filters.guests);
  if (filters.minPrice) query = query.gte("price_per_night", filters.minPrice * 100);
  if (filters.maxPrice) query = query.lte("price_per_night", filters.maxPrice * 100);
  if (filters.amenities && filters.amenities.length)
    query = query.contains("amenities", filters.amenities);
  if (filters.entire) query = query.neq("property_type", "room");
  if (filters.q) {
    const term = `%${filters.q}%`;
    query = query.or(
      `title.ilike.${term},city.ilike.${term},country.ilike.${term}`
    );
  }

  // DB-side ordering for what Postgres can do directly; JS sort for the rest.
  if (filters.sort === "price_asc")
    query = query.order("price_per_night", { ascending: true });
  else if (filters.sort === "price_desc")
    query = query.order("price_per_night", { ascending: false });
  else query = query.order("created_at", { ascending: true });

  const { data, error } = await query.returns<ListingRow[]>();
  if (error) {
    console.error("getListings error", error.message);
    return [];
  }
  const cards = (data ?? []).map(toCard);
  markBestValue(cards);

  // Heuristic / aggregate sorts Postgres can't order on directly.
  const origin =
    CITY_CENTROIDS[(filters.city ?? filters.q ?? "").trim().toLowerCase()];
  if (filters.sort === "rating") {
    cards.sort(
      (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.reviewCount - a.reviewCount
    );
  } else if (filters.sort === "best_match") {
    cards.sort((a, b) => bestMatchScore(b) - bestMatchScore(a));
  } else if (filters.sort === "distance" && origin) {
    const dist = (c: ListingCardData) =>
      c.lat != null && c.lng != null
        ? haversine(origin, [c.lat, c.lng])
        : Infinity;
    cards.sort((a, b) => dist(a) - dist(b));
  }
  return cards;
}

export type BookingWithListing = {
  id: string;
  check_in: string;
  check_out: string;
  guests: number;
  nights: number;
  nightly_total: number;
  cleaning_fee: number;
  service_fee: number;
  total_price: number;
  status: "pending" | "confirmed" | "cancelled";
  created_at: string;
  roomTypeName: string | null;
  listing: {
    id: string;
    title: string;
    city: string;
    country: string;
    price_per_night: number;
    photo: string | null;
  } | null;
};

const BOOKING_SELECT =
  "id, check_in, check_out, guests, nights, nightly_total, cleaning_fee, service_fee, total_price, status, created_at, room_type:room_types(name), listing:listings(id, title, city, country, price_per_night, listing_photos(url, position))";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toBooking(row: any): BookingWithListing {
  const l = row.listing;
  const photo =
    l?.listing_photos?.slice().sort((a: { position: number }, b: { position: number }) => a.position - b.position)[0]
      ?.url ?? null;
  return {
    ...row,
    roomTypeName: row.room_type?.name ?? null,
    listing: l
      ? {
          id: l.id,
          title: l.title,
          city: l.city,
          country: l.country,
          price_per_night: l.price_per_night,
          photo,
        }
      : null,
  };
}

export async function getBookingById(
  id: string
): Promise<BookingWithListing | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return toBooking(data);
}

export async function getUserTrips(): Promise<BookingWithListing[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("guest_id", user.id)
    .order("check_in", { ascending: false });
  return (data ?? []).map(toBooking);
}

export type HostListing = Listing & { photo: string | null; bookingCount: number };

export async function getHostListings(): Promise<HostListing[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("listings")
    .select("*, listing_photos(url, position), bookings(id)")
    .eq("host_id", user.id)
    .order("created_at", { ascending: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any[]) ?? []).map((row) => {
    const photo =
      row.listing_photos
        ?.slice()
        .sort((a: { position: number }, b: { position: number }) => a.position - b.position)[0]
        ?.url ?? null;
    const { listing_photos: _p, bookings: b, ...listing } = row;
    return { ...(listing as Listing), photo, bookingCount: b?.length ?? 0 };
  });
}

export type HostBooking = {
  id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: "pending" | "confirmed" | "cancelled";
  created_at: string;
  listingTitle: string;
  listingId: string;
  guestName: string | null;
};

export async function getHostBookings(): Promise<HostBooking[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Listings owned by this host
  const { data: listings } = await supabase
    .from("listings")
    .select("id, title")
    .eq("host_id", user.id);
  const ids = (listings ?? []).map((l) => l.id);
  if (ids.length === 0) return [];
  const titleById = new Map((listings ?? []).map((l) => [l.id, l.title]));

  const { data } = await supabase
    .from("bookings")
    .select(
      "id, check_in, check_out, guests, total_price, status, created_at, listing_id, guest:profiles!bookings_guest_id_fkey(full_name)"
    )
    .in("listing_id", ids)
    .order("check_in", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any[]) ?? []).map((row) => ({
    id: row.id,
    check_in: row.check_in,
    check_out: row.check_out,
    guests: row.guests,
    total_price: row.total_price,
    status: row.status,
    created_at: row.created_at,
    listingId: row.listing_id,
    listingTitle: titleById.get(row.listing_id) ?? "Listing",
    guestName: row.guest?.full_name ?? null,
  }));
}

export async function getHostListingForEdit(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("listings")
    .select("*, listing_photos(url, position)")
    .eq("id", id)
    .eq("host_id", user.id)
    .maybeSingle();
  if (!data) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  const photos = (row.listing_photos ?? [])
    .slice()
    .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
    .map((p: { url: string }) => p.url);
  const { listing_photos: _p, ...listing } = row;
  return { ...(listing as Listing), photos: photos as string[] };
}

export async function getUserFavoriteIds(): Promise<Set<string>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();
  const { data } = await supabase
    .from("favorites")
    .select("listing_id")
    .eq("user_id", user.id);
  return new Set((data ?? []).map((f) => f.listing_id));
}

export async function getWishlist(): Promise<ListingCardData[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("favorites")
    .select(
      "price_at_save, listing:listings(*, listing_photos(url, position), reviews(rating), host:profiles!listings_host_id_fkey(is_superhost, is_verified))"
    )
    .eq("user_id", user.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any[]) ?? [])
    .filter((row) => row.listing)
    .map((row) => ({ ...toCard(row.listing), priceAtSave: row.price_at_save }));
}

export type RoomTypeDetail = {
  id: string;
  name: string;
  description: string;
  price_per_night: number;
  cleaning_fee: number;
  max_guests: number;
  beds: number;
  bathrooms: number;
  size_sqm: number | null;
  amenities: string[];
  position: number;
  serviceFeePct: number; // inherited from the parent listing
  totalInstances: number; // inventory
  bookings: { room_instance_id: string; check_in: string; check_out: string }[];
};

export type ListingDetail = ListingCardData & {
  host: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    created_at: string;
    is_verified: boolean;
    is_superhost: boolean;
    response_time_minutes: number | null;
  };
  reviewsFull: {
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    rating_cleanliness: number | null;
    rating_location: number | null;
    rating_value: number | null;
    rating_communication: number | null;
    author: { full_name: string | null; avatar_url: string | null } | null;
  }[];
  subRatings: {
    cleanliness: number | null;
    location: number | null;
    value: number | null;
    communication: number | null;
  };
  roomTypes: RoomTypeDetail[];
};

export async function getListingById(
  id: string
): Promise<ListingDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(
      "*, listing_photos(url, position), reviews(rating), host:profiles!listings_host_id_fkey(id, full_name, avatar_url, bio, created_at, is_verified, is_superhost, response_time_minutes)"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("getListingById error", error.message);
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  const card = toCard(row);
  const serviceFeePct = row.service_fee_pct as number;

  const { data: reviewsFull } = await supabase
    .from("reviews")
    .select(
      "id, rating, comment, created_at, rating_cleanliness, rating_location, rating_value, rating_communication, author:profiles!reviews_author_id_fkey(full_name, avatar_url)"
    )
    .eq("listing_id", id)
    .order("created_at", { ascending: false });

  // Average sub-ratings for the property-score panel.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const avgSub = (key: string): number | null => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vals = ((reviewsFull as any[]) ?? [])
      .map((r) => r[key])
      .filter((v) => v != null) as number[];
    if (!vals.length) return null;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
  };
  const subRatings = {
    cleanliness: avgSub("rating_cleanliness"),
    location: avgSub("rating_location"),
    value: avgSub("rating_value"),
    communication: avgSub("rating_communication"),
  };

  // Room types + their physical instances (inventory)
  const { data: rts } = await supabase
    .from("room_types")
    .select(
      "id, name, description, price_per_night, cleaning_fee, max_guests, beds, bathrooms, size_sqm, amenities, position, room_instances(id)"
    )
    .eq("listing_id", id)
    .order("position", { ascending: true });

  // Active bookings on this listing, grouped to each room type for availability math
  const { data: bks } = await supabase
    .from("bookings")
    .select("room_type_id, room_instance_id, check_in, check_out")
    .eq("listing_id", id)
    .neq("status", "cancelled");

  const bookingsByType = new Map<
    string,
    { room_instance_id: string; check_in: string; check_out: string }[]
  >();
  for (const b of bks ?? []) {
    if (!b.room_type_id || !b.room_instance_id) continue;
    const arr = bookingsByType.get(b.room_type_id) ?? [];
    arr.push({
      room_instance_id: b.room_instance_id,
      check_in: b.check_in,
      check_out: b.check_out,
    });
    bookingsByType.set(b.room_type_id, arr);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roomTypes: RoomTypeDetail[] = ((rts as any[]) ?? []).map((rt) => ({
    id: rt.id,
    name: rt.name,
    description: rt.description,
    price_per_night: rt.price_per_night,
    cleaning_fee: rt.cleaning_fee,
    max_guests: rt.max_guests,
    beds: rt.beds,
    bathrooms: rt.bathrooms,
    size_sqm: rt.size_sqm,
    amenities: rt.amenities,
    position: rt.position,
    serviceFeePct,
    totalInstances: rt.room_instances?.length ?? 0,
    bookings: bookingsByType.get(rt.id) ?? [],
  }));

  return {
    ...card,
    host: row.host,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reviewsFull: (reviewsFull as any) ?? [],
    subRatings,
    roomTypes,
  };
}
