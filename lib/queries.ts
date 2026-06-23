import { createClient } from "@/lib/supabase/server";
import type { Listing, PropertyType } from "@/lib/database.types";

export type ListingCardData = Listing & {
  photos: string[];
  rating: number | null;
  reviewCount: number;
};

export type ListingFilters = {
  q?: string;
  city?: string;
  type?: PropertyType;
  guests?: number;
  minPrice?: number; // dollars
  maxPrice?: number; // dollars
  amenities?: string[];
  sort?: "featured" | "price_asc" | "price_desc";
};

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
  const { listing_photos: _lp, reviews: _r, ...listing } = row;
  return { ...(listing as Listing), photos, rating, reviewCount };
}

type ListingRow = Listing & {
  listing_photos: { url: string; position: number }[] | null;
  reviews: { rating: number }[] | null;
};

const SELECT = "*, listing_photos(url, position), reviews(rating)";

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
  if (filters.q) {
    const term = `%${filters.q}%`;
    query = query.or(
      `title.ilike.${term},city.ilike.${term},country.ilike.${term}`
    );
  }

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
  return (data ?? []).map(toCard);
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
      "listing:listings(*, listing_photos(url, position), reviews(rating))"
    )
    .eq("user_id", user.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any[]) ?? [])
    .map((row) => row.listing)
    .filter(Boolean)
    .map(toCard);
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
  host: { id: string; full_name: string | null; avatar_url: string | null; bio: string | null; created_at: string };
  reviewsFull: {
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    author: { full_name: string | null; avatar_url: string | null } | null;
  }[];
  roomTypes: RoomTypeDetail[];
};

export async function getListingById(
  id: string
): Promise<ListingDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(
      "*, listing_photos(url, position), reviews(rating), host:profiles!listings_host_id_fkey(id, full_name, avatar_url, bio, created_at)"
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
    .select("id, rating, comment, created_at, author:profiles!reviews_author_id_fkey(full_name, avatar_url)")
    .eq("listing_id", id)
    .order("created_at", { ascending: false });

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
    roomTypes,
  };
}
