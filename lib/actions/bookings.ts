"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { differenceInCalendarDays, parseISO, isBefore, startOfDay } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { computePricing } from "@/lib/pricing";
import { taxRuleFor } from "@/lib/tax";
import { buildBookingIcs } from "@/lib/booking-export";
import { sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { bookingConfirmationEmail } from "@/lib/emails/booking-confirmation";

const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const schema = z.object({
  roomTypeId: z.string().regex(UUID_SHAPE),
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
    roomTypeId: formData.get("roomTypeId"),
    checkin: formData.get("checkin"),
    checkout: formData.get("checkout"),
    guests: formData.get("guests"),
  });
  if (!parsed.success) return { error: "Invalid booking details." };
  const { roomTypeId, checkin, checkout, guests } = parsed.data;

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

  // Require a verified email before booking. NOTE: this is a no-op today because
  // new signups are auto-confirmed by a Supabase DB trigger — it starts enforcing
  // the moment that trigger is removed and email confirmations are enabled.
  if (!user.email_confirmed_at) {
    return {
      error:
        "Please verify your email before booking — check your inbox for the confirmation link.",
    };
  }

  // Room type is the server-side source of truth for pricing & capacity.
  // service_fee_pct + destination live on the parent listing.
  const { data: rt, error: rErr } = await supabase
    .from("room_types")
    .select(
      "id, listing_id, price_per_night, cleaning_fee, max_guests, listing:listings!room_types_listing_id_fkey(service_fee_pct, status, title, city, country)"
    )
    .eq("id", roomTypeId)
    .maybeSingle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parentListing = (rt as any)?.listing;
  if (rErr || !rt || parentListing?.status !== "published")
    return { error: "This room is no longer available." };
  if (guests > rt.max_guests)
    return { error: `This room holds up to ${rt.max_guests} guests.` };

  const nights = differenceInCalendarDays(co, ci);
  const pricing = computePricing(
    {
      pricePerNight: rt.price_per_night,
      cleaningFee: rt.cleaning_fee,
      serviceFeePct: parentListing.service_fee_pct,
    },
    ci,
    co
  );

  // book_room_instance atomically claims a free room (FOR UPDATE SKIP LOCKED)
  // and inserts the booking; the instance exclusion constraint is the backstop.
  const { data: bookingId, error: bErr } = await supabase.rpc(
    "book_room_instance",
    {
      p_room_type_id: roomTypeId,
      p_check_in: checkin,
      p_check_out: checkout,
      p_guests: guests,
      p_nights: nights,
      p_nightly_total: pricing.nightlyTotal,
      p_cleaning_fee: pricing.cleaningFee,
      p_service_fee: pricing.serviceFee,
      p_total: pricing.total,
    }
  );

  if (bErr) {
    const m = bErr.message ?? "";
    if (
      m.includes("no_availability") ||
      bErr.code === "23P01" ||
      m.includes("bookings_no_overlap")
    )
      return { error: "Sorry, that room was just booked. Please pick other dates." };
    if (m.includes("too_many_guests"))
      return { error: `This room holds up to ${rt.max_guests} guests.` };
    if (m.includes("unavailable"))
      return { error: "This room is no longer available." };
    console.error("book_room_instance error", bErr);
    return { error: "Could not complete your booking. Please try again." };
  }

  // Best-effort confirmation notifications — never fail the booking on these.
  // No-op until RESEND_API_KEY / Twilio creds are configured (see lib/email.ts).
  try {
    const id = bookingId as string;
    const taxRule = taxRuleFor(parentListing.country);
    const tax = Math.round(pricing.total * taxRule.ratePct);
    const exportData = {
      id,
      check_in: checkin,
      check_out: checkout,
      guests,
      nights,
      nightly_total: pricing.nightlyTotal,
      cleaning_fee: pricing.cleaningFee,
      service_fee: pricing.serviceFee,
      total_price: pricing.total,
      listing: {
        title: parentListing.title,
        city: parentListing.city,
        country: parentListing.country,
      },
    };
    const mail = bookingConfirmationEmail(exportData, tax, taxRule.label);
    const ics = buildBookingIcs(exportData, new Date());
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        attachments: [
          {
            filename: `wanderstay-${id.slice(0, 8)}.ics`,
            content: Buffer.from(ics).toString("base64"),
            contentType: "text/calendar",
          },
        ],
      });
    }
    if (user.phone) {
      await sendSms(
        user.phone,
        `Wanderstay: booking ${id.slice(0, 8).toUpperCase()} confirmed for ${checkin}. Details are in your email.`
      );
    }
  } catch (e) {
    console.error("[booking] notification error (non-fatal):", e);
  }

  revalidatePath("/trips");
  revalidatePath(`/listings/${rt.listing_id}`);
  redirect(`/bookings/confirmation/${bookingId as string}`);
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
