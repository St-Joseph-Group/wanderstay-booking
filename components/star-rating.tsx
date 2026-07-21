import { cn } from "@/lib/utils";

// Editorial rating mark — a small champagne diamond + serif numeral, not the
// familiar marketplace star. Reads as a curator's note rather than a score.
export function StarRating({
  rating,
  reviewCount,
  className,
  showCount = true,
}: {
  rating: number | null;
  reviewCount?: number;
  className?: string;
  showCount?: boolean;
}) {
  if (rating === null) {
    return (
      <span className={cn("overline-sm text-accent-dark", className)}>
        Newly added
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1 whitespace-nowrap text-ink",
        className
      )}
    >
      <span aria-hidden className="text-[0.7em] leading-none text-accent">
        ◆
      </span>
      <span className="numeral text-sm">{rating.toFixed(2)}</span>
      {showCount && reviewCount !== undefined && (
        <span className="overline-sm text-muted">· {reviewCount}</span>
      )}
    </span>
  );
}
