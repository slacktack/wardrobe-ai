"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";

export function FilterSheet({
  open,
  onClose,
  title = "Refine",
  onReset,
  onApply,
  applyLabel = "Show results",
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  onReset?: () => void;
  onApply?: () => void;
  applyLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Sheet open={open} onClose={onClose} label={title} className={className}>
      <div className="flex min-h-0 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-surface pb-3 pl-5 pr-16 pt-2">
          <h2 className="font-serif text-2xl leading-tight text-cream">{title}</h2>
          {onReset ? (
            <button
              type="button"
              onClick={onReset}
              className="min-h-11 shrink-0 rounded-pill px-3 text-[10px] font-medium uppercase tracking-[0.2em] text-accent transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              Reset
            </button>
          ) : null}
        </header>

        <div className="flex flex-col gap-6 px-5 py-5">{children}</div>

        {onApply ? (
          <footer className="sticky bottom-0 border-t border-line bg-surface px-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-4">
            <Button className="w-full" onClick={onApply}>
              {applyLabel}
            </Button>
          </footer>
        ) : null}
      </div>
    </Sheet>
  );
}

export function FilterSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <h3 className="text-[10px] uppercase tracking-[0.24em] text-muted">{title}</h3>
      {children}
    </section>
  );
}
