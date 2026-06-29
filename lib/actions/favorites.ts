"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleFavorite(
  listingId: string,
  isFavorited: boolean
): Promise<{ ok: boolean; favorited: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, favorited: isFavorited, error: "auth" };

  if (isFavorited) {
    await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listingId);
    revalidatePath("/wishlists");
    return { ok: true, favorited: false };
  }

  // Snapshot the current price so we can show a price-drop badge later.
  const { data: listing } = await supabase
    .from("listings")
    .select("price_per_night")
    .eq("id", listingId)
    .maybeSingle();

  await supabase.from("favorites").insert({
    user_id: user.id,
    listing_id: listingId,
    price_at_save: listing?.price_per_night ?? null,
  });
  revalidatePath("/wishlists");
  return { ok: true, favorited: true };
}
