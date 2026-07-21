import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Plus, Home, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/avatar";
import { getHostListings, getHostBookings } from "@/lib/queries";
import { getSessionProfile } from "@/lib/auth";
import { formatPrice, formatPriceCompact } from "@/lib/utils";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";

export default async function HostDashboardPage() {
  const session = await getSessionProfile();
  if (!session) redirect("/login?next=/host");

  const [listings, bookings] = await Promise.all([
    getHostListings(),
    getHostBookings(),
  ]);

  const activeBookings = bookings.filter((b) => b.status !== "cancelled");
  const revenue = activeBookings.reduce((sum, b) => sum + b.total_price, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Hosting dashboard</h1>
          <p className="text-muted">Welcome back, {session.profile.full_name}.</p>
        </div>
        <Link href="/host/listings/new">
          <Button variant="dark">
            <Plus className="h-4 w-4" /> New listing
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat icon={Home} label="Listings" value={String(listings.length)} />
        <Stat
          icon={CalendarRange}
          label="Bookings"
          value={String(activeBookings.length)}
        />
        <Stat
          icon={CalendarRange}
          label="Revenue"
          value={formatPrice(revenue)}
        />
      </div>

      {/* Listings */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-bold text-ink">Your listings</h2>
        {listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-hairline py-16 text-center">
            <Home className="mx-auto mb-3 h-10 w-10 text-muted" />
            <p className="font-semibold text-ink">No listings yet</p>
            <p className="mt-1 text-sm text-muted">
              Create your first listing to start hosting.
            </p>
            <Link href="/host/listings/new" className="mt-4 inline-block">
              <Button variant="dark">Create a listing</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <div
                key={l.id}
                className="overflow-hidden rounded-2xl border border-hairline"
              >
                <div className="relative aspect-[4/3] bg-neutral-100">
                  {l.photo && (
                    <Image
                      src={l.photo}
                      alt={l.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover"
                    />
                  )}
                  <span
                    className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      l.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {l.status === "published" ? "Published" : "Draft"}
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted">
                    {PROPERTY_TYPE_LABELS[l.property_type]} · {l.city}
                  </p>
                  <h3 className="line-clamp-1 font-semibold text-ink">
                    {l.title}
                  </h3>
                  <p className="mt-1 text-sm text-ink">
                    <span className="font-semibold">
                      {formatPriceCompact(l.price_per_night)}
                    </span>{" "}
                    night · {l.bookingCount} booking{l.bookingCount === 1 ? "" : "s"}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Link href={`/host/listings/${l.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/listings/${l.id}`} className="flex-1">
                      <Button variant="ghost" size="sm" className="w-full">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Incoming bookings */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-ink">Incoming bookings</h2>
        {activeBookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-hairline py-12 text-center text-sm text-muted">
            No bookings yet. They&apos;ll show up here when guests reserve.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-hairline">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Guest</th>
                  <th className="px-4 py-3 font-medium">Listing</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">
                    Dates
                  </th>
                  <th className="px-4 py-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {activeBookings.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={b.guestName} size={28} />
                        <span className="font-medium text-ink">
                          {b.guestName ?? "Guest"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/listings/${b.listingId}`}
                        className="text-ink hover:underline"
                      >
                        {b.listingTitle}
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 text-muted sm:table-cell">
                      {format(parseISO(b.check_in), "MMM d")} –{" "}
                      {format(parseISO(b.check_out), "MMM d, yyyy")}
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink">
                      {formatPrice(b.total_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-hairline p-5">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-brand">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-muted">{label}</p>
        <p className="text-2xl font-bold text-ink">{value}</p>
      </div>
    </div>
  );
}
