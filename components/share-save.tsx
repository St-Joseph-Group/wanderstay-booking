"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Share, Bookmark } from "lucide-react";
import { toggleFavorite } from "@/lib/actions/favorites";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

export function ShareSave({
  listingId,
  title,
  initialSaved,
  isAuthed,
}: {
  listingId: string;
  title: string;
  initialSaved: boolean;
  isAuthed: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = React.useState(initialSaved);
  const [pending, setPending] = React.useState(false);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast("Link copied to clipboard", "success");
      }
    } catch {
      /* user dismissed the share sheet */
    }
  }

  async function save() {
    if (!isAuthed) {
      toast("Log in to save places to your wishlist.", "info");
      router.push(`/login?next=/listings/${listingId}`);
      return;
    }
    if (pending) return;
    const optimistic = !saved;
    setSaved(optimistic);
    setPending(true);
    const res = await toggleFavorite(listingId, saved);
    setPending(false);
    if (!res.ok) {
      setSaved(!optimistic);
      toast("Could not update wishlist.", "error");
    } else {
      toast(optimistic ? "Saved to your collection" : "Removed from your collection", "success");
    }
  }

  return (
    <div className="ml-auto hidden items-center gap-5 sm:flex">
      <button
        onClick={share}
        className="overline-sm inline-flex items-center gap-1.5 text-ink transition-colors hover:text-accent-dark"
      >
        <Share className="h-4 w-4" strokeWidth={1.75} /> Share
      </button>
      <button
        onClick={save}
        className="overline-sm inline-flex items-center gap-1.5 text-ink transition-colors hover:text-accent-dark"
      >
        <Bookmark
          className={cn("h-4 w-4", saved && "fill-accent text-accent-dark")}
          strokeWidth={1.75}
        />
        {saved ? "Saved" : "Save"}
      </button>
    </div>
  );
}
