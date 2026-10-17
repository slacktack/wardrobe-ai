"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getLooks, subscribeLooks } from "@/lib/storage";
import type { Look } from "@/lib/types";
import { LookCard } from "@/components/lookbook/LookCard";

const SHELL_PAD = "pb-[calc(7rem_+_env(safe-area-inset-bottom,0px))]";

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="h-44 animate-pulse bg-surface-2" />
      <div className="space-y-3 p-5">
        <div className="h-6 w-2/3 animate-pulse rounded-pill bg-surface-2" />
        <div className="h-3 w-1/2 animate-pulse rounded-pill bg-surface-2" />
        <div className="h-11 w-44 animate-pulse rounded-pill bg-surface-2" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-card border border-line bg-surface px-6 py-12 text-center">
      <p className="text-[11px] uppercase tracking-[0.3em] text-muted">
        The archive is empty
      </p>
      <h2 className="mt-3 font-serif text-3xl">No looks yet</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">
        Save a look from the studio and it will appear here, ready to share.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-pill bg-acid px-6 text-sm font-medium text-ink transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid"
      >
        Build a look <ArrowUpRight size={15} aria-hidden />
      </Link>
    </div>
  );
}

export default function LookbookPage() {
  const [looks, setLooks] = useState<Look[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLooks(getLooks());
    setMounted(true);
    return subscribeLooks(() => setLooks(getLooks()));
  }, []);

  return (
    <main className={`min-h-dvh ${SHELL_PAD}`}>
      <div className="mx-auto w-full max-w-2xl px-5 pt-10">
        <header>
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted">
            Wardrobe AI
          </p>
          <h1 className="mt-2 font-serif text-5xl leading-none">Lookbook</h1>
          <p className="mt-3 text-sm text-muted">
            {mounted
              ? `${looks.length} ${looks.length === 1 ? "look" : "looks"} saved on this device`
              : "Loading your archive"}
          </p>
        </header>

        <div className="mt-8 space-y-6">
          {!mounted ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : looks.length === 0 ? (
            <EmptyState />
          ) : (
            looks.map((look, i) => (
              <LookCard key={look.id} look={look} index={i} />
            ))
          )}
        </div>
      </div>
    </main>
  );
}
