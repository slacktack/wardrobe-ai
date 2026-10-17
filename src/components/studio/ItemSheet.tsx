"use client";

import { useState } from "react";
import type { ExtractedItem, Product } from "@/lib/types";
import { ArrowUpRight, Check, RefreshCw, SearchX, Star } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductRail, ProductRailSkeleton } from "@/components/studio/ProductRail";
import type { MatchState } from "@/components/studio/useMatches";
import { discountPct, formatINR } from "@/lib/utils";

interface ItemSheetProps {
  item: ExtractedItem | null;
  match: MatchState;
  selected: Product | null;
  onClose: () => void;
  onSelect: (item: ExtractedItem, product: Product) => void;
  onRetry: (item: ExtractedItem) => void;
}

function BestMatch({ product, selected, onUse }: { product: Product; selected: boolean; onUse: () => void }) {
  const off = discountPct(product.price, product.mrp);
  return (
    <div className="mx-5 flex gap-4 rounded-card border border-acid/40 bg-acid/[0.06] p-3">
      <img
        src={product.image}
        alt=""
        referrerPolicy="no-referrer"
        className="aspect-[3/4] w-28 shrink-0 rounded-xl bg-surface-2 object-cover"
      />
      <div className="flex min-w-0 flex-1 flex-col py-0.5">
        <p className="text-xs font-medium text-acid">Best match</p>
        <p className="mt-1 line-clamp-3 text-sm leading-snug text-cream">{product.title}</p>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
          {product.store}
          {typeof product.rating === "number" ? (
            <span className="flex items-center gap-0.5">
              <Star aria-hidden className="h-3 w-3 fill-acid text-acid" />
              {product.rating.toFixed(1)}
            </span>
          ) : null}
        </p>
        <p className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-lg font-medium text-cream">{formatINR(product.price)}</span>
          {off ? <span className="text-xs text-acid">{off}% off</span> : null}
        </p>
        <div className="mt-2 flex gap-2">
          <Button size="sm" onClick={onUse} disabled={selected} className="flex-1">
            {selected ? (
              <>
                <Check aria-hidden className="h-4 w-4" />
                In your look
              </>
            ) : (
              "Use this"
            )}
          </Button>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open on ${product.store}`}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-cream hover:border-cream/30"
          >
            <ArrowUpRight aria-hidden className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

export function ItemSheet({ item, match, selected, onClose, onSelect, onRetry }: ItemSheetProps) {
  // Keeps the last item so content survives the sheet's exit animation.
  const [active, setActive] = useState<ExtractedItem | null>(item);
  if (item !== null && item !== active) setActive(item);

  const products = match.status === "ready" ? match.products : [];
  const best = products[0];
  const rest = products.slice(1);

  return (
    <Sheet open={item !== null} onClose={onClose} label={active ? `Find ${active.name}` : "Find this piece"}>
      {active ? (
        <div className="pb-6">
          <div className="pl-5 pr-16 pt-5">
            <p className="text-xs capitalize text-muted">{active.category}</p>
            <h2 className="mt-1 font-serif text-3xl leading-tight text-cream">{active.name}</h2>
            {active.description ? (
              <p className="mt-2 text-xs leading-relaxed text-muted">{active.description}</p>
            ) : null}
          </div>

          <div className="mt-5">
            {match.status === "loading" ? (
              <ProductRailSkeleton />
            ) : match.status === "error" ? (
              <EmptyState icon={RefreshCw} title="Search hit a snag." description={match.message} className="py-8">
                <Button variant="outline" size="sm" onClick={() => onRetry(active)}>
                  <RefreshCw aria-hidden className="h-4 w-4" />
                  Retry
                </Button>
              </EmptyState>
            ) : !best ? (
              <EmptyState
                icon={SearchX}
                title="Nothing close enough."
                description="Try the other gender, or upload another photo."
                className="py-8"
              >
                <Button variant="outline" size="sm" onClick={() => onRetry(active)}>
                  Search again
                </Button>
              </EmptyState>
            ) : (
              <>
                <BestMatch
                  product={best}
                  selected={selected?.id === best.id}
                  onUse={() => onSelect(active, best)}
                />
                {rest.length > 0 ? (
                  <>
                    <p className="mb-3 mt-6 px-5 text-xs text-muted">More like this</p>
                    <ProductRail products={rest} onSelect={(product) => onSelect(active, product)} />
                  </>
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}
    </Sheet>
  );
}
