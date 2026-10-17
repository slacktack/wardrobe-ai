import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Chip({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border border-line px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-muted",
        className,
      )}
      {...props}
    />
  );
}
