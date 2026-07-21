// Derived card metadata: badges from real data (host flags, price/rating,
// recency). deterministicInt is a stable per-seed helper still used for the
// listing-page location "minutes away" fallbacks.

export type Badge = { label: string; tone: "accent" | "dark" | "soft" };

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function deterministicInt(seed: string, min: number, max: number): number {
  return min + (hash(seed) % (max - min + 1));
}

export function isNew(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  return Date.now() - created < 30 * 24 * 60 * 60 * 1000;
}

export function listingBadges(listing: {
  id: string;
  created_at: string;
  isSuperhost?: boolean;
  isBestValue?: boolean;
  isVerifiedHost?: boolean;
}): Badge[] {
  const badges: Badge[] = [];
  if (listing.isSuperhost) badges.push({ label: "Superhost", tone: "dark" });
  if (listing.isBestValue) badges.push({ label: "Best Value", tone: "accent" });
  if (isNew(listing.created_at)) badges.push({ label: "New", tone: "soft" });
  if (listing.isVerifiedHost && !listing.isSuperhost)
    badges.push({ label: "Verified", tone: "soft" });
  return badges;
}

export function cancellationLabel(policy: string | null | undefined): string {
  switch (policy) {
    case "flexible":
      return "Free cancellation";
    case "strict":
      return "Strict cancellation";
    default:
      return "Free cancellation up to 5 days before";
  }
}
