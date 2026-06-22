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

  await supabase
    .from("favorites")
    .insert({ user_id: user.id, listing_id: listingId });
  revalidatePath("/wishlists");
  return { ok: true, favorited: true };
}
