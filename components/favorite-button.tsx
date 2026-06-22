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
    setPending(true);
    const res = await toggleFavorite(listingId, favorited);
    setPending(false);
    if (!res.ok) {
      setFavorited(!optimistic);
      toast("Could not update wishlist.", "error");
    }
  }

  return (
    <button
      onClick={onClick}
      aria-label={favorited ? "Remove from wishlist" : "Save to wishlist"}
      className="absolute right-3 top-3 z-10 transition-transform hover:scale-110 active:scale-95"
    >
      <Heart
        className={cn(
          size === "sm" ? "h-6 w-6" : "h-7 w-7",
          "stroke-white stroke-2 drop-shadow",
          favorited ? "fill-brand text-brand" : "fill-black/40"
        )}
      />
    </button>
  );
}
