// Client-only "recently viewed" store backed by localStorage (no DB, no PII).

export type RecentItem = {
  id: string;
  title: string;
  city: string;
  country: string;
  price: number;
  photo: string | null;
};

const KEY = "ws_recent";
const MAX = 8;

export function getRecentlyViewed(): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as RecentItem[];
  } catch {
    return [];
  }
}

export function pushRecentlyViewed(item: RecentItem): void {
  if (typeof window === "undefined") return;
  try {
    const next = [item, ...getRecentlyViewed().filter((i) => i.id !== item.id)].slice(
      0,
      MAX
    );
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / disabled storage */
  }
}
