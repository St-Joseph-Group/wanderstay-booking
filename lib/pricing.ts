import { differenceInCalendarDays, parseISO } from "date-fns";

export type PriceBreakdown = {
  nights: number;
  nightlyRate: number; // cents
  nightlyTotal: number; // cents
  cleaningFee: number; // cents
  serviceFee: number; // cents
  taxRatePct: number; // e.g. 0.12
  tax: number; // cents
  total: number; // cents (tax-inclusive)
};

export type PricingInput = {
  pricePerNight: number; // cents
  cleaningFee: number; // cents
  serviceFeePct: number; // e.g. 0.12
  taxRatePct?: number; // destination tax/VAT, e.g. 0.12 — see lib/tax.ts
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

  // Destination tax/VAT is applied to the accommodation subtotal.
  const subtotal = nightlyTotal + cleaningFee + serviceFee;
  const taxRatePct = input.taxRatePct ?? 0;
  const tax = Math.round(subtotal * taxRatePct);
  const total = subtotal + tax;

  return {
    nights,
    nightlyRate,
    nightlyTotal,
    cleaningFee,
    serviceFee,
    taxRatePct,
    tax,
    total,
  };
}
