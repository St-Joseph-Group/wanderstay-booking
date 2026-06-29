"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Sparkles } from "lucide-react";
import { SearchBar } from "@/components/search-bar";

const SUGGESTIONS = ["Bali", "Bangkok", "Siargao", "Tokyo", "Lisbon"];

export function HeaderSearch() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  // Close on navigation or Escape.
  React.useEffect(() => setOpen(false), [pathname]);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Lock background scroll/interaction while the modal is open.
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden items-center gap-3 rounded-full border border-line py-2 pl-5 pr-2 shadow-float transition-shadow hover:shadow-pop md:flex"
      >
        <span className="text-sm font-medium text-ink">
          Where would you like to escape?
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white">
          <Search className="h-4 w-4" />
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center bg-black/40 p-4 pt-20"
          onClick={() => setOpen(false)}
        >
          <div
            className="animate-fade-in w-full max-w-3xl rounded-2xl border border-line bg-surface p-6 shadow-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-2xl font-semibold text-ink">
              Where would you like to escape?
            </h2>
            <p className="mb-5 mt-1 text-sm text-muted">
              Search by destination, dates and guests — or let us plan the whole
              trip.
            </p>

            <SearchBar onNavigate={() => setOpen(false)} />

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Popular
              </span>
              {SUGGESTIONS.map((s) => (
                <Link
                  key={s}
                  href={`/search?q=${encodeURIComponent(s)}`}
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink transition-colors hover:border-ink"
                >
                  {s}
                </Link>
              ))}
              <Link
                href="/plan"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-sm font-semibold text-accent-dark transition-colors hover:bg-accent hover:text-ink"
              >
                <Sparkles className="h-3.5 w-3.5" /> Plan my Trip
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
