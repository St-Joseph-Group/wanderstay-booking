"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Sparkles, X, ArrowRight } from "lucide-react";
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
        className="group flex w-full items-center gap-3 rounded-full border border-hairline bg-surface py-2 pl-5 pr-2 shadow-sm transition-all hover:border-accent/50 hover:shadow-card"
        aria-label="Search stays"
      >
        <Search
          className="h-4 w-4 shrink-0 text-accent-dark"
          strokeWidth={2}
        />
        <span className="flex-1 truncate text-left text-sm text-muted">
          Where would you like to go?
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors group-hover:bg-brand-dark">
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </span>
      </button>

      {render &&
        createPortal(
          <div
            onClick={close}
            onTransitionEnd={() => {
              // Unmount once the leave transition has finished.
              if (!visible) setRender(false);
            }}
            className={cn(
              "fixed inset-0 z-[70] flex items-start justify-center p-4 pt-20 backdrop-blur-md transition-opacity duration-200 ease-out",
              visible ? "bg-black/40 opacity-100" : "bg-black/0 opacity-0"
            )}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "relative w-full max-w-3xl rounded-2xl border border-hairline bg-canvas p-8 shadow-pop transition-all duration-200 ease-out",
                visible
                  ? "translate-y-0 scale-100 opacity-100"
                  : "-translate-y-2 scale-[0.98] opacity-0"
              )}
            >
              <button
                onClick={close}
                aria-label="Close search"
                className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-sm text-ink transition-colors hover:bg-black/5"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
              <p className="overline text-accent-dark">The concierge</p>
              <h2 className="mt-2 font-display text-3xl text-ink">
                Where would you like to escape?
              </h2>
              <p className="mb-6 mt-2 text-sm text-muted">
                Search by destination, dates and guests — or let us compose the
                whole itinerary.
              </p>

              <SearchBar onNavigate={close} />

              <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="overline-sm text-muted">Frequently sought</span>
                {SUGGESTIONS.map((s) => (
                  <Link
                    key={s}
                    href={`/search?q=${encodeURIComponent(s)}`}
                    onClick={close}
                    className="overline-sm rounded-sm border border-hairline px-3 py-2 text-ink transition-colors hover:border-ink"
                  >
                    {s}
                  </Link>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between gap-3 border-t border-hairline pt-5">
                <p className="text-sm text-muted">Not sure where to go?</p>
                <Link
                  href="/plan"
                  onClick={close}
                  className="inline-flex items-center gap-2 text-accent-dark transition-colors hover:text-ink"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="overline">Plan my Trip</span>
                </Link>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
