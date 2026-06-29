"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Sparkles, X } from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { cn } from "@/lib/utils";

const SUGGESTIONS = ["Bali", "Bangkok", "Siargao", "Tokyo", "Lisbon"];

export function HeaderSearch() {
  // `render` keeps the modal mounted through its exit animation; `visible`
  // drives the enter/leave transition.
  const [render, setRender] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const pathname = usePathname();

  const open = () => setRender(true);
  const close = () => setVisible(false);

  // Fade/scale in on the frame after mount.
  React.useEffect(() => {
    if (!render) return;
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [render]);

  // Close on navigation or Escape.
  React.useEffect(() => close(), [pathname]);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Lock background scroll/interaction while the modal is mounted.
  React.useEffect(() => {
    if (!render) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [render]);

  return (
    <>
      <button
        onClick={open}
        className="hidden items-center gap-3 rounded-full border border-line py-1.5 pl-5 pr-1.5 shadow-float transition-shadow hover:shadow-pop md:flex"
      >
        <span className="text-sm font-medium text-ink">
          Where would you like to escape?
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white">
          <Search className="h-3.5 w-3.5" />
        </span>
      </button>

      {render && (
        <div
          onClick={close}
          onTransitionEnd={() => {
            // Unmount once the leave transition has finished.
            if (!visible) setRender(false);
          }}
          className={cn(
            "fixed inset-0 z-[70] flex items-start justify-center p-4 pt-20 transition-opacity duration-200 ease-out",
            visible ? "bg-black/40 opacity-100" : "bg-black/0 opacity-0"
          )}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative w-full max-w-3xl rounded-2xl border border-line bg-surface p-6 shadow-pop transition-all duration-200 ease-out",
              visible
                ? "translate-y-0 scale-100 opacity-100"
                : "-translate-y-2 scale-[0.98] opacity-0"
            )}
          >
            <button
              onClick={close}
              aria-label="Close search"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-neutral-100"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="font-display text-2xl font-semibold text-ink">
              Where would you like to escape?
            </h2>
            <p className="mb-5 mt-1 text-sm text-muted">
              Search by destination, dates and guests — or let us plan the whole
              trip.
            </p>

            <SearchBar onNavigate={close} />

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Popular
              </span>
              {SUGGESTIONS.map((s) => (
                <Link
                  key={s}
                  href={`/search?q=${encodeURIComponent(s)}`}
                  onClick={close}
                  className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink transition-colors hover:border-ink"
                >
                  {s}
                </Link>
              ))}
              <Link
                href="/plan"
                onClick={close}
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
