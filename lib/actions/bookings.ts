"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { differenceInCalendarDays, parseISO, isBefore, startOfDay } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { computePricing } from "@/lib/pricing";

const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const schema = z.object({
  listingId: z.string().regex(UUID_SHAPE),
  checkin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkout: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.coerce.number().int().min(1).max(50),
});

export type BookingState = { error?: string } | undefined;

export async function createBooking(
  _prev: BookingState,
  formData: FormData
): Promise<BookingState> {
  const parsed = schema.safeParse({
    listingId: formData.get("listingId"),
    checkin: formData.get("checkin"),
    checkout: formData.get("checkout"),
    guests: formData.get("guests"),
  });
  if (!parsed.success) return { error: "Invalid booking details." };
  const { listingId, checkin, checkout, guests } = parsed.data;

  const ci = parseISO(checkin);
  const co = parseISO(checkout);
  if (!isBefore(ci, co)) return { error: "Checkout must be after check-in." };
  if (isBefore(ci, startOfDay(new Date())))
    return { error: "Check-in cannot be in the past." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in to complete your booking." };

  // Fetch listing (server-side source of truth for pricing & capacity)
  const { data: listing, error: lErr } = await supabase
    .from("listings")
    .select(
      "id, price_per_night, cleaning_fee, service_fee_pct, max_guests, status"
    )
    .eq("id", listingId)
    .maybeSingle();
  if (lErr || !listing || listing.status !== "published")
    return { error: "This listing is no longer available." };
  if (guests > listing.max_guests)
    return { error: `This place holds up to ${listing.max_guests} guests.` };

  // Availability check
  const { data: available } = await supabase.rpc("is_listing_available", {
    p_listing_id: listingId,
    p_check_in: checkin,
    p_check_out: checkout,
  });
  if (available === false)
    return { error: "Sorry, those dates were just booked. Please pick others." };

  const nights = differenceInCalendarDays(co, ci);
  const pricing = computePricing(
    {
      pricePerNight: listing.price_per_night,
      cleaningFee: listing.cleaning_fee,
      serviceFeePct: listing.service_fee_pct,
    },
    ci,
    co
  );

  const { data: booking, error: bErr } = await supabase
    .from("bookings")
    .insert({
      listing_id: listingId,
      guest_id: user.id,
      check_in: checkin,
      check_out: checkout,
      guests,
      nights,
      nightly_total: pricing.nightlyTotal,
      cleaning_fee: pricing.cleaningFee,
      service_fee: pricing.serviceFee,
      total_price: pricing.total,
      status: "confirmed",
    })
    .select("id")
    .single();

  if (bErr) {
    // Exclusion constraint violation = race on overlapping dates
    if (bErr.code === "23P01" || bErr.message.includes("bookings_no_overlap"))
      return { error: "Those dates were just booked. Please pick others." };
    console.error("createBooking error", bErr);
    return { error: "Could not complete your booking. Please try again." };
  }

  revalidatePath("/trips");
  revalidatePath(`/listings/${listingId}`);
  redirect(`/bookings/confirmation/${booking.id}`);
}

export async function cancelBooking(bookingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("guest_id", user.id);
  revalidatePath("/trips");
}
