"use client";

import { useCurrency } from "@/lib/currency";

/** Renders a USD-cent amount in the user's selected currency. */
export function Price({
  cents,
  className,
}: {
  cents: number;
  className?: string;
}) {
  const { format } = useCurrency();
  return <span className={className}>{format(cents)}</span>;
}
