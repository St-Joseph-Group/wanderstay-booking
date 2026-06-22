import { notFound, redirect } from "next/navigation";
import { ListingForm } from "@/components/listing-form";
import { updateListing } from "@/lib/actions/host";
import { getHostListingForEdit } from "@/lib/queries";
import { getSessionProfile } from "@/lib/auth";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSessionProfile();
  if (!session) redirect(`/login?next=/host/listings/${id}/edit`);

  const listing = await getHostListingForEdit(id);
  if (!listing) notFound();

  const boundUpdate = updateListing.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-1 text-3xl font-bold text-ink">Edit listing</h1>
      <p className="mb-8 text-muted">Update the details for “{listing.title}”.</p>
      <ListingForm
        action={boundUpdate}
        userId={session.userId}
        initial={listing}
        submitLabel="Save changes"
      />
    </div>
  );
}
