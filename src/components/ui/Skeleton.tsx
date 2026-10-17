import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-xl bg-cream/[0.06]", className)}
      {...props}
    />
  );
}
