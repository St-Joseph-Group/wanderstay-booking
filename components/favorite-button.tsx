"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { toggleFavorite } from "@/lib/actions/favorites";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  listingId,
  initial,
  isAuthed,
  size = "md",
}: {
  listingId: string;
  initial: boolean;
  isAuthed: boolean;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [favorited, setFavorited] = React.useState(initial);
  const [pending, setPending] = React.useState(false);
  const [justSaved, setJustSaved] = React.useState(false);

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthed) {
      toast("Log in to save places to your wishlist.", "info");
      router.push("/login?next=/");
      return;
    }
    if (pending) return;
    const optimistic = !favorited;
    setFavorited(optimistic);
    if (optimistic) setJustSaved(true);
    setPending(true);
    const res = await toggleFavorite(listingId, favorited);
    setPending(false);
    if (!res.ok) {
      setFavorited(!optimistic);
      toast("Could not update wishlist.", "error");
    }
  }

  return (
    <div className="group/fav absolute right-3 top-3 z-10">
      <button
        onClick={onClick}
        aria-label={
          favorited ? "Remove from your collection" : "Save to your collection"
        }
        className={cn(
          "flex items-center justify-center rounded-full bg-canvas/90 shadow-sm backdrop-blur transition-all hover:bg-canvas active:scale-95",
          size === "sm" ? "h-8 w-8" : "h-9 w-9"
        )}
      >
        <Bookmark
          onAnimationEnd={() => setJustSaved(false)}
          className={cn(
            size === "sm" ? "h-4 w-4" : "h-[1.15rem] w-[1.15rem]",
            justSaved && "animate-saved-pop",
            favorited
              ? "fill-accent text-accent-dark"
              : "fill-transparent text-ink"
          )}
          strokeWidth={1.75}
        />
      </button>
      <span className="overline-sm pointer-events-none absolute right-0 top-full mt-1.5 hidden whitespace-nowrap rounded-sm bg-ink px-2 py-1 text-white shadow-pop group-hover/fav:block">
        {favorited ? "In your collection" : "Save"}
      </span>
    </div>
  );
}
