"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
  className,
}: {
  options: ReadonlyArray<SegmentOption<T>>;
  value: T;
  onChange: (value: T) => void;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const id = useId();
  const reduceMotion = useReducedMotion();

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "flex items-stretch rounded-pill border border-line bg-surface-2 p-1",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex min-w-0 flex-1 items-center justify-center rounded-pill px-3 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
              size === "sm" ? "min-h-10 text-[11px]" : "min-h-11 text-xs",
              active ? "text-cream" : "text-muted hover:text-cream",
            )}
          >
            {active ? (
              reduceMotion ? (
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-pill border border-line bg-surface shadow-soft"
                />
              ) : (
                <motion.span
                  aria-hidden
                  layoutId={`segment-${id}`}
                  className="absolute inset-0 rounded-pill border border-line bg-surface shadow-soft"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )
            ) : null}
            <span className="relative truncate font-medium">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
