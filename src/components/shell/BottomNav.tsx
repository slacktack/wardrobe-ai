"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, CircleUserRound, ScanLine, Search } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Scan", icon: ScanLine },
  { href: "/search", label: "Search", icon: Search },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/profile", label: "Profile", icon: CircleUserRound },
] as const;

function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/saved") {
    return pathname.startsWith("/saved") || pathname.startsWith("/lookbook");
  }
  return pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto w-full max-w-[430px] px-3 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex h-16 items-stretch gap-0.5 rounded-[1.35rem] border border-line bg-ink/85 px-1.5 shadow-float backdrop-blur-xl">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href, pathname);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl text-[9px] font-medium uppercase tracking-[0.14em] transition-colors duration-150 active:scale-[0.97]",
                  active ? "text-accent" : "text-muted hover:text-cream",
                )}
              >
                {active ? (
                  <motion.span
                    aria-hidden
                    layoutId="nav-plate"
                    className="absolute inset-x-1.5 inset-y-1.5 rounded-2xl bg-cream/[0.07]"
                    transition={
                      reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }
                    }
                  />
                ) : null}
                <Icon
                  aria-hidden
                  className="relative h-5 w-5"
                  strokeWidth={active ? 2.1 : 1.7}
                />
                <span className="relative">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
