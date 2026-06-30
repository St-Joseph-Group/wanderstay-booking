"use client";

import { useCurrency } from "@/lib/currency";
import type { PriceBreakdown } from "@/lib/pricing";

export function PriceBreakdownRows({
  breakdown,
}: {
  breakdown: PriceBreakdown;
}) {
  const { format } = useCurrency();
  if (breakdown.nights === 0) return null;
  return (
    <div className="space-y-3 text-sm text-ink">
      <Row
        label={`${format(breakdown.nightlyRate)} × ${breakdown.nights} ${
          breakdown.nights === 1 ? "night" : "nights"
        }`}
        value={format(breakdown.nightlyTotal)}
      />
      {breakdown.cleaningFee > 0 && (
        <Row label="Cleaning fee" value={format(breakdown.cleaningFee)} />
      )}
      <Row label="Wanderstay service fee" value={format(breakdown.serviceFee)} />
      <div className="mt-3 flex items-center justify-between border-t border-line pt-3 font-bold">
        <span>Total</span>
        <span>{format(breakdown.total)}</span>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted underline-offset-2">{label}</span>
      <span>{value}</span>
    </div>
  );
}
