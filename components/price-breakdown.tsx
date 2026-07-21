"use client";

import { useCurrency } from "@/lib/currency";
import type { PriceBreakdown } from "@/lib/pricing";

export function PriceBreakdownRows({
  breakdown,
  taxLabel = "Taxes",
}: {
  breakdown: PriceBreakdown;
  taxLabel?: string;
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
      {breakdown.tax > 0 && (
        <Row label={taxLabel} value={format(breakdown.tax)} />
      )}
      <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
        <span className="overline-sm text-ink">Total</span>
        <span className="numeral text-base text-ink">{format(breakdown.total)}</span>
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
