"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CreditCard, Lock, ShieldCheck } from "lucide-react";
import { createBooking, type BookingState } from "@/lib/actions/bookings";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/lib/currency";

function detectBrand(num: string): string | null {
  const n = num.replace(/\D/g, "");
  if (!n) return null;
  if (/^4/.test(n)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^6(011|5)/.test(n)) return "Discover";
  if (/^35/.test(n)) return "JCB";
  return null;
}

function PayButton({ total }: { total: number }) {
  const { pending } = useFormStatus();
  const { format } = useCurrency();
  return (
    <Button
      type="submit"
      variant="dark"
      size="lg"
      className="w-full"
      disabled={pending}
    >
      {pending ? "Confirming…" : `Confirm Booking • ${format(total)}`}
    </Button>
  );
}

export function CheckoutForm({
  roomTypeId,
  checkin,
  checkout,
  guests,
  total,
  freeCancelLabel,
}: {
  roomTypeId: string;
  checkin: string;
  checkout: string;
  guests: number;
  total: number;
  freeCancelLabel: string;
}) {
  const [state, formAction] = useActionState<BookingState, FormData>(
    createBooking,
    undefined
  );
  const [card, setCard] = React.useState("4242 4242 4242 4242");
  const brand = detectBrand(card);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="roomTypeId" value={roomTypeId} />
      <input type="hidden" name="checkin" value={checkin} />
      <input type="hidden" name="checkout" value={checkout} />
      <input type="hidden" name="guests" value={guests} />

      <div className="rounded-xl border border-hairline bg-surface p-5 shadow-card">
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
                value={card}
                onChange={(e) => setCard(e.target.value)}
                inputMode="numeric"
                className="pl-10 pr-20"
              />
              <CreditCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              {brand && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-hairline bg-canvas px-2 py-0.5 text-xs font-semibold text-ink">
                  {brand}
                </span>
              )}
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

      <div>
        <PayButton total={total} />
        <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
          <ShieldCheck className="h-3.5 w-3.5 text-accent-dark" />
          Free cancellation until {freeCancelLabel} · your card won&apos;t be
          charged until confirmed
        </p>
      </div>
    </form>
  );
}
