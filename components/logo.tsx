import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2 text-brand", className)}
      aria-label="Wanderstay home"
    >
      <svg viewBox="0 0 32 32" className="h-8 w-8 fill-current" aria-hidden>
        <path d="M16 1c-1.6 0-3 .9-3.8 2.4L3 21.2c-.5 1-.7 1.8-.7 2.7C2.3 27.2 5 30 8.3 30c2 0 3.6-.9 4.9-2.5l2.8-3.5 2.8 3.5c1.3 1.6 2.9 2.5 4.9 2.5 3.3 0 6-2.8 6-6.1 0-.9-.2-1.7-.7-2.7L19.8 3.4C19 1.9 17.6 1 16 1zm0 3.1c.4 0 .8.2 1.1.7l7 13.5c-1.3.4-2.4 1.2-3.3 2.3L16 26.3l-4.8-5.7c-.9-1.1-2-1.9-3.3-2.3l7-13.5c.3-.5.7-.7 1.1-.7z" />
      </svg>
      <span className="hidden text-xl font-extrabold tracking-tight sm:block">
        wanderstay
      </span>
    </Link>
  );
}
