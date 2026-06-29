// Curated, offline destination content powering Plan-my-Trip and the listing
// "neighborhood / nearby" sections. No external API — deterministic and free.

export type POI = {
  title: string;
  kind: "Beach" | "Attraction" | "Cafe" | "Food" | "Activity";
  blurb: string;
};

export type Experience = {
  name: string;
  type: "Tour" | "Transport" | "Food Experience";
  price: number; // per person, USD
  blurb: string;
};

export type Destination = {
  key: string; // lowercased city
  label: string;
  centroid: [number, number];
  tagline: string;
  neighborhoods: { name: string; vibe: string }[];
  landmarks: { name: string; minutes: number }[];
  pois: POI[];
  experiences: Experience[];
};

export const DESTINATIONS: Destination[] = [
  {
    key: "quezon",
    label: "Quezon",
    centroid: [13.9347, 121.6324],
    tagline: "Pacific-facing coves, surf towns and quiet white-sand escapes.",
    neighborhoods: [
      { name: "Padre Burgos", vibe: "Dive resorts & calm bays" },
      { name: "Pagbilao", vibe: "Island-hopping & sandbars" },
      { name: "Real", vibe: "Surf breaks & laid-back cafes" },
    ],
    landmarks: [
      { name: "Beach", minutes: 4 },
      { name: "Town center", minutes: 12 },
      { name: "Airport (Lucena)", minutes: 45 },
    ],
    pois: [
      { title: "Borawan Island", kind: "Beach", blurb: "Palawan-like cliffs and powder sand." },
      { title: "Dampalitan Sandbar", kind: "Beach", blurb: "Pine-lined shoreline, great at low tide." },
      { title: "Kamay ni Hesus", kind: "Attraction", blurb: "Hilltop shrine with sweeping views." },
      { title: "Kape Kesada", kind: "Cafe", blurb: "Local art cafe with single-origin brews." },
      { title: "Buko Pie stop", kind: "Food", blurb: "The region's famous coconut pie." },
      { title: "Island hopping", kind: "Activity", blurb: "Borawan–Dampalitan–Puting Buhangin loop." },
    ],
    experiences: [
      { name: "3-island hopping boat", type: "Tour", price: 28, blurb: "Private bangka with a local guide." },
      { name: "Airport transfer (Lucena)", type: "Transport", price: 22, blurb: "Door-to-door air-con van." },
      { name: "Seafood paluto dinner", type: "Food Experience", price: 18, blurb: "Pick-and-cook fresh catch by the bay." },
    ],
  },
  {
    key: "bali",
    label: "Bali",
    centroid: [-8.4095, 115.1889],
    tagline: "Rice terraces, surf beaches and temple sunsets.",
    neighborhoods: [
      { name: "Canggu", vibe: "Surf & cafe culture" },
      { name: "Ubud", vibe: "Jungle, yoga & art" },
      { name: "Uluwatu", vibe: "Clifftop beach clubs" },
    ],
    landmarks: [
      { name: "Beach", minutes: 6 },
      { name: "Town center", minutes: 15 },
      { name: "Airport (DPS)", minutes: 40 },
    ],
    pois: [
      { title: "Tegallalang Rice Terraces", kind: "Attraction", blurb: "Iconic emerald terraces." },
      { title: "Uluwatu Temple", kind: "Attraction", blurb: "Clifftop temple + Kecak fire dance." },
      { title: "Echo Beach", kind: "Beach", blurb: "Black-sand surf at sunset." },
      { title: "Crate Cafe", kind: "Cafe", blurb: "Canggu's buzziest brunch spot." },
      { title: "Warung local feast", kind: "Food", blurb: "Babi guling and nasi campur." },
      { title: "Sunrise Mt Batur trek", kind: "Activity", blurb: "Volcano hike above the clouds." },
    ],
    experiences: [
      { name: "Mt Batur sunrise trek", type: "Tour", price: 45, blurb: "Guided hike with breakfast." },
      { name: "Private driver (full day)", type: "Transport", price: 40, blurb: "Air-con car + English-speaking driver." },
      { name: "Balinese cooking class", type: "Food Experience", price: 35, blurb: "Market tour + hands-on class." },
    ],
  },
  {
    key: "bangkok",
    label: "Bangkok",
    centroid: [13.7563, 100.5018],
    tagline: "Street food, glittering temples and rooftop bars.",
    neighborhoods: [
      { name: "Sukhumvit", vibe: "Nightlife & malls" },
      { name: "Riverside", vibe: "Temples & heritage" },
      { name: "Thonglor", vibe: "Cafes & speakeasies" },
    ],
    landmarks: [
      { name: "BTS station", minutes: 5 },
      { name: "City center", minutes: 18 },
      { name: "Airport (BKK)", minutes: 35 },
    ],
    pois: [
      { title: "Grand Palace & Wat Pho", kind: "Attraction", blurb: "Reclining Buddha and royal halls." },
      { title: "Chatuchak Market", kind: "Attraction", blurb: "8,000-stall weekend market." },
      { title: "Wat Arun", kind: "Attraction", blurb: "Temple of Dawn at golden hour." },
      { title: "Roast Coffee", kind: "Cafe", blurb: "Thonglor specialty roastery." },
      { title: "Boat-noodle alley", kind: "Food", blurb: "Tiny bowls of rich broth." },
      { title: "Longtail canal tour", kind: "Activity", blurb: "Backwater klongs of Thonburi." },
    ],
    experiences: [
      { name: "Street-food night tour", type: "Tour", price: 32, blurb: "Tuk-tuk crawl through Chinatown." },
      { name: "Airport rail + transfer", type: "Transport", price: 14, blurb: "Skip the traffic to downtown." },
      { name: "Thai cooking class", type: "Food Experience", price: 30, blurb: "Market visit + 4 dishes." },
    ],
  },
];

export function findDestination(query: string): Destination | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return (
    DESTINATIONS.find((d) => q.includes(d.key) || d.key.includes(q)) ?? null
  );
}

// Assemble a day-by-day plan from the destination's POI pool.
export function buildItinerary(
  dest: Destination,
  days: number
): { day: number; items: POI[] }[] {
  const pool = dest.pois;
  const perDay = 3;
  const out: { day: number; items: POI[] }[] = [];
  for (let d = 0; d < Math.max(1, Math.min(days, 7)); d++) {
    const items: POI[] = [];
    for (let i = 0; i < perDay; i++) {
      items.push(pool[(d * perDay + i) % pool.length]);
    }
    out.push({ day: d + 1, items });
  }
  return out;
}
