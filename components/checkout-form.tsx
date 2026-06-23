"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CreditCard, Lock } from "lucide-react";
import { createBooking, type BookingState } from "@/lib/actions/bookings";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

function PayButton({ total }: { total: number }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="dark"
      size="lg"
      className="w-full"
      disabled={pending}
    >
      {pending ? "Confirming…" : `Confirm and pay ${formatPrice(total)}`}
    </Button>
  );
}

export function CheckoutForm({
  roomTypeId,
  checkin,
  checkout,
  guests,
  total,
}: {
  roomTypeId: string;
  checkin: string;
  checkout: string;
  guests: number;
  total: number;
}) {
  const [state, formAction] = useActionState<BookingState, FormData>(
    createBooking,
    undefined
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="roomTypeId" value={roomTypeId} />
      <input type="hidden" name="checkin" value={checkin} />
      <input type="hidden" name="checkout" value={checkout} />
      <input type="hidden" name="guests" value={guests} />

      <div className="rounded-2xl border border-neutral-200 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Pay with</h2>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Lock className="h-3.5 w-3.5" /> Secure mock checkout
          </div>
        </div>

        <div className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          This is a demo. No real payment is processed — any card details work.
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="card">Card number</Label>
            <div className="relative">
              <Input
                id="card"
                defaultValue="4242 4242 4242 4242"
                inputMode="numeric"
                className="pl-10"
              />
              <CreditCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="exp">Expiration</Label>
              <Input id="exp" defaultValue="12 / 28" />
            </div>
            <div>
              <Label htmlFor="cvc">CVC</Label>
              <Input id="cvc" defaultValue="123" />
            </div>
          </div>
          <div>
            <Label htmlFor="zip">ZIP code</Label>
            <Input id="zip" defaultValue="10001" />
          </div>
        </div>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <PayButton total={total} />
      <p className="text-center text-xs text-muted">
        By selecting the button above, you agree to Wanderstay&apos;s demo terms.
      </p>
    </form>
  );
}
