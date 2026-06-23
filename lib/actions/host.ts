"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { PropertyType } from "@/lib/database.types";

export async function becomeHost() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/host/become");

  await supabase.from("profiles").update({ is_host: true }).eq("id", user.id);
  revalidatePath("/", "layout");
  redirect("/host/listings/new");
}

const listingSchema = z.object({
  title: z.string().min(4, "Give your place a descriptive title."),
  description: z.string().min(10, "Add a description (at least 10 characters)."),
  property_type: z.enum([
    "apartment",
    "house",
    "villa",
    "room",
    "cabin",
    "loft",
    "cottage",
  ]),
  country: z.string().min(2, "Country is required."),
  city: z.string().min(1, "City is required."),
  address: z.string().optional(),
  price_per_night: z.coerce.number().min(1, "Set a nightly price."),
  cleaning_fee: z.coerce.number().min(0).default(0),
  max_guests: z.coerce.number().int().min(1),
  bedrooms: z.coerce.number().int().min(0),
  beds: z.coerce.number().int().min(1),
  bathrooms: z.coerce.number().min(0.5),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
});

export type ListingFormState = { error?: string } | undefined;

function parseListing(formData: FormData) {
  return listingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    property_type: formData.get("property_type"),
    country: formData.get("country"),
    city: formData.get("city"),
    address: formData.get("address") || undefined,
    price_per_night: formData.get("price_per_night"),
    cleaning_fee: formData.get("cleaning_fee") || 0,
    max_guests: formData.get("max_guests"),
    bedrooms: formData.get("bedrooms"),
    beds: formData.get("beds"),
    bathrooms: formData.get("bathrooms"),
    lat: formData.get("lat") || undefined,
    lng: formData.get("lng") || undefined,
  });
}

export async function createListing(
  _prev: ListingFormState,
  formData: FormData
): Promise<ListingFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in." };

  const parsed = parseListing(formData);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const amenities = formData.getAll("amenity").map(String);
  const photos = formData.getAll("photo").map(String).filter(Boolean);
  const status = formData.get("status") === "published" ? "published" : "draft";
  const d = parsed.data;

  // Ensure the user is flagged as a host
  await supabase.from("profiles").update({ is_host: true }).eq("id", user.id);

  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      host_id: user.id,
      title: d.title,
      description: d.description,
      property_type: d.property_type as PropertyType,
      country: d.country,
      city: d.city,
      address: d.address ?? null,
      lat: d.lat ?? null,
      lng: d.lng ?? null,
      price_per_night: Math.round(d.price_per_night * 100),
      cleaning_fee: Math.round((d.cleaning_fee ?? 0) * 100),
      max_guests: d.max_guests,
      bedrooms: d.bedrooms,
      beds: d.beds,
      bathrooms: d.bathrooms,
      amenities,
      status,
    })
    .select("id")
    .single();

  if (error || !listing) {
    console.error("createListing error", error);
    return { error: "Could not create the listing. Please try again." };
  }

  if (photos.length) {
    await supabase.from("listing_photos").insert(
      photos.map((url, i) => ({
        listing_id: listing.id,
        url,
        position: i,
      }))
    );
  }

  // Every listing has at least one bookable room type (the whole place).
  // Phase 4 will let hosts add more room types directly.
  const { data: rt } = await supabase
    .from("room_types")
    .insert({
      listing_id: listing.id,
      name: "Entire place",
      description: d.description,
      price_per_night: Math.round(d.price_per_night * 100),
      cleaning_fee: Math.round((d.cleaning_fee ?? 0) * 100),
      max_guests: d.max_guests,
      beds: d.beds,
      bathrooms: d.bathrooms,
      amenities,
    })
    .select("id")
    .single();
  if (rt) {
    await supabase
      .from("room_instances")
      .insert({ room_type_id: rt.id, label: "Room 1" });
  }

  revalidatePath("/host");
  revalidatePath("/search");
  redirect("/host");
}

export async function updateListing(
  listingId: string,
  _prev: ListingFormState,
  formData: FormData
): Promise<ListingFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in." };

  const parsed = parseListing(formData);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const amenities = formData.getAll("amenity").map(String);
  const photos = formData.getAll("photo").map(String).filter(Boolean);
  const status = formData.get("status") === "published" ? "published" : "draft";
  const d = parsed.data;

  const { error } = await supabase
    .from("listings")
    .update({
      title: d.title,
      description: d.description,
      property_type: d.property_type as PropertyType,
      country: d.country,
      city: d.city,
      address: d.address ?? null,
      lat: d.lat ?? null,
      lng: d.lng ?? null,
      price_per_night: Math.round(d.price_per_night * 100),
      cleaning_fee: Math.round((d.cleaning_fee ?? 0) * 100),
      max_guests: d.max_guests,
      bedrooms: d.bedrooms,
      beds: d.beds,
      bathrooms: d.bathrooms,
      amenities,
      status,
    })
    .eq("id", listingId)
    .eq("host_id", user.id);

  if (error) {
    console.error("updateListing error", error);
    return { error: "Could not update the listing." };
  }

  // Replace photos if a new set was provided
  if (photos.length) {
    await supabase.from("listing_photos").delete().eq("listing_id", listingId);
    await supabase.from("listing_photos").insert(
      photos.map((url, i) => ({ listing_id: listingId, url, position: i }))
    );
  }

  // Keep the default "Entire place" room type in sync with the listing-level
  // price/capacity. Other room types (Phase 4) are edited on their own.
  await supabase
    .from("room_types")
    .update({
      description: d.description,
      price_per_night: Math.round(d.price_per_night * 100),
      cleaning_fee: Math.round((d.cleaning_fee ?? 0) * 100),
      max_guests: d.max_guests,
      beds: d.beds,
      bathrooms: d.bathrooms,
      amenities,
    })
    .eq("listing_id", listingId)
    .eq("name", "Entire place");

  revalidatePath("/host");
  revalidatePath(`/listings/${listingId}`);
  redirect("/host");
}

export async function deleteListing(listingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("listings")
    .delete()
    .eq("id", listingId)
    .eq("host_id", user.id);
  revalidatePath("/host");
  revalidatePath("/search");
}
