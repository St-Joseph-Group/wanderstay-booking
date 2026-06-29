"use client";

import * as React from "react";
import { LayoutGrid, Map as MapIcon } from "lucide-react";
import { ListingCard } from "@/components/listing-card";
import { SearchMap } from "@/components/search-map";
import { cn } from "@/lib/utils";
import type { ListingCardData } from "@/lib/queries";

export function SearchResults({
  listings,
  favoritedIds,
  isAuthed,
}: {
  listings: ListingCardData[];
  favoritedIds: string[];
  isAuthed: boolean;
}) {
  const [view, setView] = React.useState<"grid" | "map">("grid");
  const fav = React.useMemo(() => new Set(favoritedIds), [favoritedIds]);

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <div className="inline-flex rounded-lg border border-line bg-surface p-0.5">
          <ToggleBtn
            active={view === "grid"}
            onClick={() => setView("grid")}
            icon={<LayoutGrid className="h-4 w-4" />}
            label="Grid"
          />
          <ToggleBtn
            active={view === "map"}
            onClick={() => setView("map")}
            icon={<MapIcon className="h-4 w-4" />}
            label="Show map"
          />
        </div>
      </div>

      {view === "map" ? (
        <SearchMap listings={listings} />
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing, i) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isFavorited={fav.has(listing.id)}
              isAuthed={isAuthed}
              priority={i < 4}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
        active ? "bg-brand text-white" : "text-ink hover:bg-neutral-100"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
