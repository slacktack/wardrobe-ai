import type { Product } from "@/lib/types";
import { ArrowUpRight, Star } from "lucide-react";
import { discountPct, formatINR } from "@/lib/utils";

function ProductCard({ product, onSelect }: { product: Product; onSelect: (product: Product) => void }) {
  const off = discountPct(product.price, product.mrp);

  return (
    <div className="relative w-[9.5rem]">
      <button
        type="button"
        onClick={() => onSelect(product)}
        aria-label={`Pick ${product.title}`}
        className="w-full text-left"
      >
        <span className="relative block aspect-[3/4] overflow-hidden rounded-card border border-line bg-surface-2">
          <img
            src={product.image}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
          {off ? (
            <span className="absolute left-2 top-2 rounded-pill bg-ink/80 px-2 py-1 text-[10px] font-medium text-acid backdrop-blur">
              -{off}%
            </span>
          ) : null}
        </span>
        <span className="mt-2 block space-y-1">
          <span className="line-clamp-2 text-xs leading-snug text-cream">{product.title}</span>
          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-muted">
            <span className="truncate">{product.store}</span>
            {typeof product.rating === "number" ? (
              <span className="flex shrink-0 items-center gap-0.5 normal-case tracking-normal">
                <Star aria-hidden className="h-3 w-3 fill-acid text-acid" />
                {product.rating.toFixed(1)}
                {typeof product.ratingCount === "number" ? ` (${product.ratingCount})` : ""}
              </span>
            ) : null}
          </span>
          <span className="flex flex-wrap items-baseline gap-1.5">
            <span className="text-sm font-medium text-cream">{formatINR(product.price)}</span>
            {product.mrp && product.mrp > product.price ? (
              <span className="text-[11px] text-muted line-through">{formatINR(product.mrp)}</span>
            ) : null}
          </span>
        </span>
      </button>
      <a
        href={product.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${product.title} on ${product.store}`}
        className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-ink/70 text-cream backdrop-blur transition-colors hover:bg-ink"
      >
        <ArrowUpRight aria-hidden className="h-4 w-4" />
      </a>
    </div>
  );
}

function SeeAllCard({ product }: { product: Product }) {
  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`See all matches on ${product.store}`}
      className="flex w-[5.5rem] flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line px-2 text-muted transition-colors hover:border-acid/50 hover:text-acid"
    >
      <ArrowUpRight aria-hidden className="h-5 w-5" />
      <span className="text-[10px] uppercase tracking-[0.18em]">See all</span>
      <span className="truncate text-[9px] uppercase tracking-[0.14em] text-muted">
        {product.store}
      </span>
    </a>
  );
}

export function ProductRailSkeleton() {
  return (
    <div className="snap-row gap-3 pl-5 pr-5">
      {[0, 1, 2].map((index) => (
        <div key={index} className="w-[9.5rem]">
          <div className="aspect-[3/4] animate-pulse rounded-card border border-line bg-white/[0.04]" />
          <div className="mt-2.5 h-3 w-4/5 animate-pulse rounded-pill bg-white/[0.05]" />
          <div className="mt-2 h-3 w-2/5 animate-pulse rounded-pill bg-white/[0.04]" />
        </div>
      ))}
    </div>
  );
}

export function ProductRail({
  products,
  onSelect,
}: {
  products: Product[];
  onSelect: (product: Product) => void;
}) {
  const first = products[0];
  return (
    <div className="snap-row gap-3 pl-5 pr-5 pb-1">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onSelect={onSelect} />
      ))}
      {first ? <SeeAllCard product={first} /> : null}
    </div>
  );
}
