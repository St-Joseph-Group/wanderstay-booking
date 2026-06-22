import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/database.types";

/**
 * Returns the current auth user and their profile row (server-side).
 * Lazily creates a profile if the auth user has none yet, so we never
 * depend solely on the database trigger.
 */
export async function getSessionProfile(): Promise<{
  userId: string;
  email: string | null;
  profile: Profile;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    const fallbackName =
      (user.user_metadata?.full_name as string | undefined) ??
      user.email?.split("@")[0] ??
      "Guest";
    const { data: created } = await supabase
      .from("profiles")
      .upsert({ id: user.id, full_name: fallbackName })
      .select("*")
      .single();
    profile = created ?? null;
  }

  if (!profile) return null;
  return { userId: user.id, email: user.email ?? null, profile };
}
