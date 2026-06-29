"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
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
        aria-label={favorited ? "Remove from wishlist" : "Save to wishlist"}
        className="block transition-transform hover:scale-110 active:scale-95"
      >
        <Heart
          onAnimationEnd={() => setJustSaved(false)}
          className={cn(
            size === "sm" ? "h-6 w-6" : "h-7 w-7",
            "stroke-white stroke-2 drop-shadow",
            justSaved && "animate-saved-pop",
            favorited ? "fill-accent text-accent" : "fill-black/40"
          )}
        />
      </button>
      <span className="pointer-events-none absolute right-0 top-full mt-1 hidden whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-medium text-white shadow-pop group-hover/fav:block">
        {favorited ? "Saved" : "Save"}
      </span>
    </div>
  );
}
