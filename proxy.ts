import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 renamed `middleware` → `proxy` (nodejs runtime). This refreshes the
// Supabase auth session on navigation so server components see a valid user.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Run on all routes except Next internals and static assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
