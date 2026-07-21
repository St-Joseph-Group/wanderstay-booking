import { Award } from "lucide-react";

type Sub = {
  cleanliness: number | null;
  location: number | null;
  value: number | null;
  communication: number | null;
};

export function PropertyScore({
  rating,
  subRatings,
}: {
  rating: number | null;
  subRatings: Sub;
}) {
  const cats = [
    { label: "Cleanliness", value: subRatings.cleanliness },
    { label: "Location", value: subRatings.location },
    { label: "Value", value: subRatings.value },
    { label: "Communication", value: subRatings.communication },
  ].filter((c) => c.value != null) as { label: string; value: number }[];

  const base =
    rating ??
    (cats.length
      ? cats.reduce((a, c) => a + c.value, 0) / cats.length
      : null);
  if (base == null) return null;
  const score = Math.round((base / 5) * 100);

  const valueTag =
    (subRatings.value ?? 0) >= 4.6
      ? "Above market"
      : (subRatings.value ?? 0) >= 4
        ? "Fair value"
        : "Premium";

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-6">
      <div className="flex items-center justify-between border-b border-hairline pb-4">
        <h3 className="overline flex items-center gap-2 text-ink">
          <Award className="h-4 w-4 text-accent-dark" strokeWidth={1.75} /> Property score
        </h3>
        <div className="flex items-baseline text-right">
          <span className="numeral text-3xl text-ink">{score}</span>
          <span className="overline-sm ml-1 text-muted">/ 100</span>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {cats.map((c) => (
          <div key={c.label}>
            <div className="mb-1.5 flex justify-between">
              <span className="overline-sm text-muted">{c.label}</span>
              <span className="numeral text-sm text-ink">
                {c.value.toFixed(1)}
              </span>
            </div>
            <div className="h-px w-full overflow-hidden bg-hairline">
              <div
                className="h-full bg-accent"
                style={{ width: `${(c.value / 5) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="overline-sm rounded-sm border border-hairline px-2.5 py-1.5 text-accent-dark">
          Value · {valueTag}
        </span>
        {(subRatings.cleanliness ?? 0) >= 4.6 && (
          <span className="overline-sm rounded-sm border border-hairline px-2.5 py-1.5 text-ink">
            Cleanliness · Top-rated
          </span>
        )}
        {(rating ?? 0) >= 4.6 && (
          <span className="overline-sm rounded-sm border border-hairline px-2.5 py-1.5 text-ink">
            Satisfaction · High
          </span>
        )}
      </div>
    </div>
  );
}
