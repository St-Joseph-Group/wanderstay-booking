"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cancelBooking } from "@/lib/actions/bookings";
import { toast } from "@/components/ui/toaster";

export function CancelTripButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function onClick() {
    if (pending) return;
    if (!confirm("Cancel this booking? This cannot be undone.")) return;
    setPending(true);
    await cancelBooking(bookingId);
    setPending(false);
    toast("Booking cancelled.", "success");
    router.refresh();
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="text-sm font-semibold text-ink underline hover:text-brand disabled:opacity-50"
    >
      {pending ? "Cancelling…" : "Cancel booking"}
    </button>
  );
}
