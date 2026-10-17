"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChipOption {
  value: string;
  label?: string;
  icon?: LucideIcon;
}

function toOption(entry: string | ChipOption): ChipOption {
  return typeof entry === "string" ? { value: entry } : entry;
}

export function ChipGroup({
  options,
  selected,
  onToggle,
  label,
  className,
}: {
  options: ReadonlyArray<string | ChipOption>;
  selected: ReadonlyArray<string>;
  onToggle: (value: string) => void;
  label?: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((entry) => {
        const option = toOption(entry);
        const active = selected.includes(option.value);
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(option.value)}
            className={cn(
              "inline-flex min-h-11 select-none items-center gap-1.5 rounded-pill border px-3.5 text-[10px] font-medium uppercase tracking-[0.16em] transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
              active
                ? "border-transparent bg-acid text-acid-ink"
                : "border-line text-muted hover:border-cream/25 hover:text-cream",
            )}
          >
            {Icon ? <Icon aria-hidden className="h-3.5 w-3.5" strokeWidth={1.8} /> : null}
            {option.label ?? option.value}
          </button>
        );
      })}
    </div>
  );
}
