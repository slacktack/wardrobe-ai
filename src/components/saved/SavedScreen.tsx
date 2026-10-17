"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BookmarkX, Layers } from "lucide-react";
import type { Product } from "@/lib/types";
import { useSavedLooks, useSavedProducts } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductSheet } from "@/components/product/ProductSheet";

type Tab = "looks" | "products";

function LookTile({
  lookId,
  title,
  vibe,
  count,
  hero,
  onRemove,
}: {
  lookId: string;
  title: string;
  vibe?: string;
  count: number;
  hero?: string;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-card border border-line bg-surface">
      <Link href="/lookbook" className="block">
        <span className="relative block aspect-[4/5] overflow-hidden bg-surface-2">
          {hero ? (
            <img
              src={hero}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          ) : null}
          <span className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
          <span className="absolute inset-x-3 bottom-3">
            <span className="line-clamp-2 block font-serif text-lg leading-tight text-cream">
              {vibe ?? title}
            </span>
            <span className="mt-0.5 block text-[9px] uppercase tracking-[0.18em] text-muted">
              {count} {count === 1 ? "piece" : "pieces"}
            </span>
          </span>
        </span>
      </Link>
      <button
        type="button"
        onClick={() => onRemove(lookId)}
        aria-label={`Delete ${title}`}
        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border border-cream/10 bg-ink/70 text-cream backdrop-blur-md transition-colors hover:bg-ink"
      >
        <BookmarkX aria-hidden className="h-4 w-4" />
      </button>
    </div>
  );
}

export function SavedScreen() {
  const [tab, setTab] = useState<Tab>("looks");
  const [selected, setSelected] = useState<Product | null>(null);
  const { looks, remove: removeLook, ready: looksReady } = useSavedLooks();
  const { products, ready: productsReady } = useSavedProducts();

  const closeSheet = useCallback(() => setSelected(null), []);

  return (
    <div className="flex flex-col gap-5 px-5 pb-32 pt-6">
      <header className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted">Kept for later</p>
        <h1 className="font-serif text-4xl leading-none text-cream">Saved</h1>
      </header>

      <SegmentedControl<Tab>
        label="Saved view"
        value={tab}
        onChange={setTab}
        options={[
          { value: "looks", label: `Looks${looks.length ? ` (${looks.length})` : ""}` },
          { value: "products", label: `Pieces${products.length ? ` (${products.length})` : ""}` },
        ]}
      />

      {tab === "looks" ? (
        looksReady && looks.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {looks.map((look) => (
              <LookTile
                key={look.id}
                lookId={look.id}
                title={look.title}
                vibe={look.vibe}
                count={look.picks.filter((pick) => pick.product).length}
                hero={look.picks.find((pick) => pick.product)?.product?.image}
                onRemove={removeLook}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-card border border-line bg-surface">
            <EmptyLooks />
          </div>
        )
      ) : (
        <ProductGrid
          products={products}
          loading={!productsReady}
          skeletonCount={4}
          onPress={setSelected}
          emptyIcon={Layers}
          emptyTitle="No pieces saved yet."
          emptyDescription="Tap the bookmark on any product to keep it here."
        >
          <Link href="/search" className="mt-1 contents">
            <Button variant="outline">Browse the racks</Button>
          </Link>
        </ProductGrid>
      )}

      <ProductSheet product={selected} onClose={closeSheet} />
    </div>
  );
}

function EmptyLooks() {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted">The archive is empty</p>
      <h2 className="font-serif text-2xl text-cream">No looks yet</h2>
      <p className="max-w-[30ch] text-xs leading-relaxed text-muted">
        Save a look from the studio and it lands here, ready to share.
      </p>
      <Link href="/studio" className="contents">
        <Button className="mt-1">
          Build a look <ArrowUpRight aria-hidden className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
