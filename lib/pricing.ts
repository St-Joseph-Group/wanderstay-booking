import { differenceInCalendarDays, parseISO } from "date-fns";

export type PriceBreakdown = {
  nights: number;
  nightlyRate: number; // cents
  nightlyTotal: number; // cents
  cleaningFee: number; // cents
  serviceFee: number; // cents
  total: number; // cents
};

export type PricingInput = {
  pricePerNight: number; // cents
  cleaningFee: number; // cents
  serviceFeePct: number; // e.g. 0.12
};

/**
 * The single source of truth for booking price math. Used by the listing
 * booking card, the checkout page, and the server action that records a
 * booking — so the numbers can never drift between them.
 */
export function computePricing(
  input: PricingInput,
  checkIn: Date | string,
  checkOut: Date | string
): PriceBreakdown {
  const ci = typeof checkIn === "string" ? parseISO(checkIn) : checkIn;
  const co = typeof checkOut === "string" ? parseISO(checkOut) : checkOut;
  const nights = Math.max(0, differenceInCalendarDays(co, ci));

  const nightlyRate = input.pricePerNight;
  const nightlyTotal = nightlyRate * nights;
  const cleaningFee = nights > 0 ? input.cleaningFee : 0;
  const serviceFee = Math.round(nightlyTotal * input.serviceFeePct);
  const total = nightlyTotal + cleaningFee + serviceFee;

  return { nights, nightlyRate, nightlyTotal, cleaningFee, serviceFee, total };
}
