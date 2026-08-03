import Link from "next/link";
import { LogoMark } from "@/components/logo-mark";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2.5 text-brand", className)}
      aria-label="Wanderstay home"
    >
      {/* To use the original raster logo instead, drop it in `public/` and
          replace this with next/image pointing at it — nothing else changes. */}
      <LogoMark className="h-10 w-auto shrink-0 sm:h-12" />
      <span className="font-display text-2xl font-medium lowercase tracking-[0.14em] sm:text-3xl">
        wanderstay
      </span>
    </Link>
  );
}
