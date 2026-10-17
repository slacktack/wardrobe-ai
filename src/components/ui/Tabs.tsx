"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  className,
}: {
  tabs: ReadonlyArray<TabItem<T>>;
  value: T;
  onChange: (value: T) => void;
  label?: string;
  className?: string;
}) {
  const id = useId();
  const reduceMotion = useReducedMotion();

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn("flex items-stretch gap-1 border-b border-line", className)}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              "relative flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 px-2 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
              active ? "text-cream" : "text-muted hover:text-cream",
            )}
          >
            <span className="truncate">{tab.label}</span>
            {typeof tab.count === "number" ? (
              <span className="shrink-0 rounded-pill bg-surface-2 px-1.5 py-0.5 text-[9px] leading-none text-muted">
                {tab.count}
              </span>
            ) : null}
            {active ? (
              reduceMotion ? (
                <span aria-hidden className="absolute inset-x-2 bottom-0 h-0.5 rounded-pill bg-accent" />
              ) : (
                <motion.span
                  aria-hidden
                  layoutId={`tab-underline-${id}`}
                  className="absolute inset-x-2 bottom-0 h-0.5 rounded-pill bg-accent"
                  transition={{ type: "spring", stiffness: 460, damping: 36 }}
                />
              )
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
