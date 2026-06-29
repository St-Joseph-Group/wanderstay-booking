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
    <div className="rounded-lg border border-line bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
          <Award className="h-5 w-5 text-accent-dark" /> Property score
        </h3>
        <div className="text-right">
          <span className="font-display text-3xl font-bold text-ink">
            {score}
          </span>
          <span className="text-muted"> / 100</span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {cats.map((c) => (
          <div key={c.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-ink">{c.label}</span>
              <span className="font-semibold text-ink">
                {c.value.toFixed(1)}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${(c.value / 5) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-md bg-accent-soft px-2 py-1 font-semibold text-accent-dark">
          Value: {valueTag}
        </span>
        {(subRatings.cleanliness ?? 0) >= 4.6 && (
          <span className="rounded-md bg-brand/5 px-2 py-1 font-semibold text-brand">
            Cleanliness: Top-rated
          </span>
        )}
        {(rating ?? 0) >= 4.6 && (
          <span className="rounded-md bg-brand/5 px-2 py-1 font-semibold text-brand">
            Guest satisfaction: High
          </span>
        )}
      </div>
    </div>
  );
}
