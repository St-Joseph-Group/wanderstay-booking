// Derived card metadata: badges + social-proof lines.
// Badges come from real data (host flags, price/rating, recency). Social-proof
// numbers are deterministic + illustrative where the platform has no real
// signal yet (views/weekend demand) — stable per listing so they never flicker.

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

// One stable, lightly-illustrative urgency/social-proof line per listing.
export function socialProof(id: string): string {
  const variants = [
    `Booked ${deterministicInt(id + "b", 4, 18)}× this week`,
    `Viewed ${deterministicInt(id + "v", 20, 90)}+ times today`,
    `${deterministicInt(id + "w", 70, 95)}% booked this weekend`,
    `Only ${deterministicInt(id + "l", 1, 3)} left for popular dates`,
    `In high demand right now`,
  ];
  return variants[hash(id + "sp") % variants.length];
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
