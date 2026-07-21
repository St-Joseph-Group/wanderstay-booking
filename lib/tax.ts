// Destination tax / VAT / occupancy-tax rules, keyed by listing country.
//
// ⚠️ ILLUSTRATIVE RATES ONLY — these are placeholders to wire up the tax
// mechanism end-to-end. They are NOT tax/legal advice and are almost certainly
// not the correct rates for a real booking (many countries vary by region,
// stay length, or property type). Replace with authoritative, jurisdiction-
// specific rules (ideally a maintained data source) before charging real money.

export type TaxRule = {
  ratePct: number; // fraction, e.g. 0.12 = 12%
  label: string; // shown on the price breakdown
};

const DEFAULT_RULE: TaxRule = { ratePct: 0.1, label: "Taxes & fees" };

const RULES: Record<string, TaxRule> = {
  Philippines: { ratePct: 0.12, label: "VAT (12%)" },
  Indonesia: { ratePct: 0.11, label: "VAT (11%)" },
  Portugal: { ratePct: 0.06, label: "VAT (6%)" },
  Japan: { ratePct: 0.1, label: "Consumption tax (10%)" },
  "United States": { ratePct: 0.14, label: "Occupancy tax" },
  "United Kingdom": { ratePct: 0.2, label: "VAT (20%)" },
  France: { ratePct: 0.1, label: "VAT + city tax" },
  Spain: { ratePct: 0.1, label: "VAT (10%)" },
  Italy: { ratePct: 0.1, label: "VAT + city tax" },
  Thailand: { ratePct: 0.07, label: "VAT (7%)" },
};

/** Look up the tax rule for a listing's country (falls back to a default). */
export function taxRuleFor(country: string | null | undefined): TaxRule {
  if (!country) return DEFAULT_RULE;
  return RULES[country.trim()] ?? DEFAULT_RULE;
}
