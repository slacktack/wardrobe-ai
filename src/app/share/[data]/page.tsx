import { Suspense } from "react";
import type { Metadata } from "next";
import SharedLook from "@/components/lookbook/SharedLook";

export const metadata: Metadata = {
  title: "A look by Wardrobe AI",
  description: "A curated look, shared from Wardrobe AI.",
};

function ShareSkeleton() {
  return (
    <main
      aria-hidden
      className="min-h-dvh pb-[calc(7rem_+_env(safe-area-inset-bottom,0px))]"
    >
      <div className="mx-auto w-full max-w-3xl px-5 pt-10">
        <div className="h-3 w-40 animate-pulse rounded-pill bg-surface-2" />
        <div className="mt-4 h-10 w-3/4 animate-pulse rounded-card bg-surface-2" />
        <div className="mt-5 h-4 w-1/2 animate-pulse rounded-pill bg-surface-2" />
        <div className="mt-8 grid grid-cols-2 gap-2 sm:gap-3">
          <div className="aspect-[3/4] animate-pulse rounded-card bg-surface-2" />
          <div className="aspect-[3/4] animate-pulse rounded-card bg-surface-2" />
        </div>
      </div>
    </main>
  );
}

export default function SharePage({
  params,
}: {
  params: Promise<{ data: string }>;
}) {
  return (
    <Suspense fallback={<ShareSkeleton />}>
      {params.then(({ data }) => (
        <SharedLook encoded={data} />
      ))}
    </Suspense>
  );
}
