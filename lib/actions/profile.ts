"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileState = { error?: string; success?: boolean } | undefined;

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  if (!fullName) return { error: "Name cannot be empty." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in." };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, bio: bio || null })
    .eq("id", user.id);
  if (error) return { error: "Could not save your profile." };

  revalidatePath("/", "layout");
  revalidatePath("/account");
  return { success: true };
}
