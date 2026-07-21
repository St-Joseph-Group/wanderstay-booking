"use client";

import * as React from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useCurrency, CURRENCIES, type CurrencyCode } from "@/lib/currency";
import { cn } from "@/lib/utils";

const NAMES: Record<CurrencyCode, string> = {
  USD: "US Dollar",
  PHP: "Philippine Peso",
  EUR: "Euro",
  GBP: "British Pound",
  JPY: "Japanese Yen",
  AUD: "Australian Dollar",
  SGD: "Singapore Dollar",
  CAD: "Canadian Dollar",
};

export function CurrencySelect() {
  const { code, setCode } = useCurrency();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Change currency"
        aria-haspopup="listbox"
        aria-expanded={open}
        className="hidden h-10 items-center gap-1.5 rounded-full px-3.5 text-ink transition-colors hover:bg-brand/[0.06] lg:flex"
      >
        <Globe className="h-4 w-4" strokeWidth={1.75} />
        <span className="text-sm font-medium">{code}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-hairline bg-surface py-1.5 shadow-pop">
          <p className="overline-sm px-3 py-2 text-muted">
            Display currency
          </p>
          {CURRENCIES.map((c) => (
            <button
              key={c}
              onClick={() => {
                setCode(c);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-black/5",
                c === code ? "font-semibold text-ink" : "text-ink"
              )}
            >
              <span>
                {c} · {NAMES[c]}
              </span>
              {c === code && <Check className="h-4 w-4 text-accent-dark" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
