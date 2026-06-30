"use client";

import * as React from "react";

export type CurrencyCode =
  | "USD"
  | "PHP"
  | "EUR"
  | "GBP"
  | "JPY"
  | "AUD"
  | "SGD"
  | "CAD";

// Indicative static rates (1 USD = X). Demo-only — not live FX.
const RATES: Record<CurrencyCode, number> = {
  USD: 1,
  PHP: 58.5,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 157,
  AUD: 1.52,
  SGD: 1.35,
  CAD: 1.36,
};

const SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  PHP: "₱",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AUD: "A$",
  SGD: "S$",
  CAD: "C$",
};

export const CURRENCIES = Object.keys(RATES) as CurrencyCode[];

type Ctx = {
  code: CurrencyCode;
  setCode: (c: CurrencyCode) => void;
  format: (usdCents: number) => string;
  symbol: string;
};

const CurrencyContext = React.createContext<Ctx | null>(null);

function fmt(usdCents: number, code: CurrencyCode): string {
  const amount = (usdCents / 100) * RATES[code];
  return `${SYMBOLS[code]}${Math.round(amount).toLocaleString("en-US")}`;
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [code, setCodeState] = React.useState<CurrencyCode>("USD");

  React.useEffect(() => {
    const saved = localStorage.getItem("ws_currency");
    if (saved && saved in RATES) setCodeState(saved as CurrencyCode);
  }, []);

  const setCode = React.useCallback((c: CurrencyCode) => {
    setCodeState(c);
    try {
      localStorage.setItem("ws_currency", c);
    } catch {
      /* ignore */
    }
  }, []);

  const value = React.useMemo<Ctx>(
    () => ({
      code,
      setCode,
      format: (usdCents: number) => fmt(usdCents, code),
      symbol: SYMBOLS[code],
    }),
    [code, setCode]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): Ctx {
  const ctx = React.useContext(CurrencyContext);
  // Fallback to USD when rendered outside a provider.
  return (
    ctx ?? {
      code: "USD",
      setCode: () => {},
      format: (c: number) => fmt(c, "USD"),
      symbol: "$",
    }
  );
}
