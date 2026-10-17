import { cn } from "@/lib/utils";

export function StoreBadge({
  store,
  className,
}: {
  store: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-1.5 rounded-pill border border-line bg-surface-2 px-2 py-1 text-[9px] uppercase leading-none tracking-[0.14em] text-muted",
        className,
      )}
    >
      <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent/70" />
      <span className="truncate">{store}</span>
    </span>
  );
}
