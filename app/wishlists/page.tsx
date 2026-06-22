import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/listing-card";
import { getWishlist } from "@/lib/queries";
import { getSessionProfile } from "@/lib/auth";

export default async function WishlistsPage() {
  const session = await getSessionProfile();
  if (!session) redirect("/login?next=/wishlists");

  const listings = await getWishlist();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold text-ink">Wishlists</h1>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 py-20 text-center">
          <Heart className="mb-3 h-10 w-10 text-muted" />
          <p className="text-lg font-semibold text-ink">
            Nothing saved yet
          </p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Tap the heart on any stay to save it here for later.
          </p>
          <Link href="/search" className="mt-5">
            <Button variant="dark">Browse stays</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isFavorited
              isAuthed
            />
          ))}
        </div>
      )}
    </div>
  );
}
