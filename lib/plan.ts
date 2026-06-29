import { DESTINATIONS } from "@/lib/destinations";

export type ParsedTrip = {
  raw: string;
  place: string | null;
  days: number | null;
  guests: number | null;
  maxPrice: number | null;
};

// Heuristic, offline parse of a natural-language trip request, e.g.
// "3-day beach trip in Quezon under 2000 per night with 2 guests".
export function parseTripQuery(text: string): ParsedTrip {
  const raw = text ?? "";
  const lower = raw.toLowerCase();

  const days = lower.match(/(\d+)\s*-?\s*(?:day|night)/)?.[1];
  const guests = lower.match(/(\d+)\s*(?:guest|people|pax|adult|person)/)?.[1];
  const budget = lower.match(/(?:under|below|max|upto|up to|<)\s*\$?\s*([\d,]+)/)?.[1];

  let place: string | null = null;
  const inMatch = lower.match(
    /\bin\s+([a-z\s]+?)(?:\s+(?:under|below|with|for|near|that|,)|$)/
  );
  if (inMatch) place = inMatch[1].trim();
  if (!place) {
    const d = DESTINATIONS.find((dd) => lower.includes(dd.key));
    if (d) place = d.label;
  }

  return {
    raw,
    place: place || null,
    days: days ? parseInt(days, 10) : null,
    guests: guests ? parseInt(guests, 10) : null,
    maxPrice: budget ? parseInt(budget.replace(/,/g, ""), 10) : null,
  };
}
