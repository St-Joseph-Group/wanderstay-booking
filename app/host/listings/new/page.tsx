import { redirect } from "next/navigation";
import { ListingForm } from "@/components/listing-form";
import { createListing } from "@/lib/actions/host";
import { getSessionProfile } from "@/lib/auth";

export default async function NewListingPage() {
  const session = await getSessionProfile();
  if (!session) redirect("/login?next=/host/listings/new");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-1 text-3xl font-bold text-ink">List your place</h1>
      <p className="mb-8 text-muted">
        Fill in the details below. You can save a draft and publish later.
      </p>
      <ListingForm
        action={createListing}
        userId={session.userId}
        submitLabel="Publish listing"
      />
    </div>
  );
}
