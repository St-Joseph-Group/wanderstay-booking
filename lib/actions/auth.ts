"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AuthState =
  | { error?: string; needsVerification?: boolean }
  | undefined;

// Only allow internal, absolute-path redirects. Rejects absolute URLs
// ("https://evil.com"), protocol-relative ("//evil.com"), and anything with a
// scheme — closing the open-redirect via the `next` param.
function safeNext(raw: unknown): string {
  const next = String(raw ?? "/");
  if (next.startsWith("/") && !next.startsWith("//") && !next.includes("://")) {
    return next;
  }
  return "/";
}

export async function signIn(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) return { error: "Email and password are required." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUp(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!fullName) return { error: "Please enter your name." };
  if (!email || !password) return { error: "Email and password are required." };
  if (password.length < 6)
    return { error: "Password must be at least 6 characters." };

  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { error: error.message };

  // Try to sign in immediately. Today the demo auto-confirm DB trigger makes
  // this succeed, so signup flows straight through. Once email confirmation is
  // enabled (trigger removed), sign-in returns "email not confirmed" and we show
  // a "check your email" state instead.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) {
    const code = (signInError as { code?: string }).code;
    if (code === "email_not_confirmed" || /confirm/i.test(signInError.message)) {
      return { needsVerification: true };
    }
    return { error: signInError.message };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
