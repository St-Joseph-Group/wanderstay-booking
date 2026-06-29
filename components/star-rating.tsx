import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

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
    return <span className={cn("text-sm text-muted", className)}>New</span>;
  }
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm text-ink", className)}>
      <Star className="h-3.5 w-3.5 fill-accent text-accent" />
      <span className="font-semibold">{rating.toFixed(2)}</span>
      {showCount && reviewCount !== undefined && (
        <span className="text-muted">({reviewCount})</span>
      )}
    </span>
  );
}
