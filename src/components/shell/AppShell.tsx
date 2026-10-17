import type { ReactNode } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/shell/BottomNav";
import { ThemeToggle } from "@/components/shell/ThemeToggle";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col border-line sm:border-x">
      <header className="sticky top-0 z-30 border-b border-line bg-ink/85 pt-safe backdrop-blur-md">
        <div className="flex h-14 items-center justify-between pl-5 pr-2.5">
          <Link
            href="/"
            aria-label="Wardrobe AI — home"
            className="flex items-center gap-2.5 rounded-pill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-full border border-cream/15 font-serif text-lg italic leading-none text-acid"
            >
              W
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-cream">
              Wardrobe AI
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
      <BottomNav />
    </div>
  );
}
