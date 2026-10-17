import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(count);
}

function StarRow({ size, className }: { size: number; className: string }) {
  return (
    <span className={cn("flex w-max items-center gap-0.5", className)}>
      {[0, 1, 2, 3, 4].map((index) => (
        <Star key={index} aria-hidden size={size} className="fill-current" />
      ))}
    </span>
  );
}

export function RatingStars({
  rating,
  count,
  size = 12,
  showValue = true,
  className,
}: {
  rating?: number;
  count?: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}) {
  if (typeof rating !== "number" || !Number.isFinite(rating) || rating <= 0) return null;
  const clamped = Math.min(5, Math.max(0, rating));
  const label = `Rated ${clamped.toFixed(1)} out of 5${typeof count === "number" ? ` from ${count} reviews` : ""}`;

  return (
    <span
      role="img"
      aria-label={label}
      className={cn("inline-flex min-w-0 items-center gap-1.5", className)}
    >
      <span className="relative inline-flex shrink-0">
        <StarRow size={size} className="text-muted/30" />
        <span
          aria-hidden
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${(clamped / 5) * 100}%` }}
        >
          <StarRow size={size} className="text-accent" />
        </span>
      </span>
      {showValue ? (
        <span className="truncate text-[10px] leading-none text-cream">
          {clamped.toFixed(1)}
          {typeof count === "number" && count > 0 ? (
            <span className="text-muted"> ({formatCount(count)})</span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
