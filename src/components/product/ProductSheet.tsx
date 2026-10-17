"use client";

import { useEffect, useState } from "react";
import { Bookmark, Check, ExternalLink } from "lucide-react";
import type { Product } from "@/lib/types";
import { cn, discountPct, formatINR } from "@/lib/utils";
import { useSavedProducts } from "@/lib/store";
import { IconButton } from "@/components/ui/IconButton";
import { PriceTag } from "@/components/ui/PriceTag";
import { RatingStars } from "@/components/ui/RatingStars";
import { Sheet } from "@/components/ui/Sheet";
import { Spinner } from "@/components/ui/Spinner";
import { ProductImage } from "@/components/product/ProductImage";
import { postJson, parseSearch } from "@/components/studio/api";

function comparableQuery(title: string): string {
  return title.split("|")[0].replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim().slice(0, 64);
}

function PriceRow({
  product,
  active,
  onSelect,
}: {
  product: Product;
  active: boolean;
  onSelect: (product: Product) => void;
}) {
  const off = discountPct(product.price, product.mrp);
  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => onSelect(product)}
      onFocus={() => onSelect(product)}
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition-colors",
        active ? "border-acid/60 bg-acid/[0.06]" : "border-line hover:border-cream/20",
      )}
    >
      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
        <ProductImage src={product.image} sizes="56px" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11px] uppercase tracking-[0.16em] text-muted">
          {product.store}
        </span>
        <span className="mt-0.5 flex items-baseline gap-2">
          <span className="text-sm font-medium text-cream">{formatINR(product.price)}</span>
          {off ? <span className="text-[10px] text-acid">-{off}%</span> : null}
        </span>
      </span>
      {typeof product.rating === "number" ? (
        <RatingStars rating={product.rating} count={product.ratingCount} size={10} />
      ) : null}
    </a>
  );
}

export function ProductSheet({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const [others, setOthers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const { isSaved, toggle } = useSavedProducts();

  useEffect(() => {
    if (!product) {
      setOthers([]);
      setFocused(null);
      return;
    }
    setFocused(product.id);
    setOthers([]);
    setLoading(true);
    let live = true;
    const query = comparableQuery(product.title);
    void postJson("/api/search", { query, limit: 24 })
      .then((data) => {
        if (!live) return;
        const result = parseSearch(data);
        if (!result.ok) return;
        setOthers(result.products.filter((entry) => entry.id !== product.id));
      })
      .catch(() => undefined)
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [product]);

  if (!product) return null;

  const saved = isSaved(product.id);
  const off = discountPct(product.price, product.mrp);
  const byStore = new Map<string, Product>();
  for (const entry of others) {
    const current = byStore.get(entry.store);
    if (!current || entry.price < current.price) byStore.set(entry.store, entry);
  }
  const comparison = [
    product,
    ...Array.from(byStore.values()).filter((entry) => entry.price !== product.price),
  ].sort((a, b) => a.price - b.price);
  const cheapest = comparison[0];

  return (
    <Sheet open={product !== null} onClose={onClose} label={product.title}>
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-2">
        <ProductImage src={product.image} sizes="430px" priority />
        <div className="absolute right-2.5 top-2.5">
          <IconButton
            label={saved ? "Remove from saved" : "Save this piece"}
            variant="glass"
            onClick={() => toggle(product)}
          >
            <Bookmark
              aria-hidden
              className={cn("h-5 w-5", saved && "fill-accent text-accent")}
              strokeWidth={saved ? 2 : 1.8}
            />
          </IconButton>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-2">
          {product.brand ? (
            <p className="text-[10px] uppercase tracking-[0.24em] text-muted">{product.brand}</p>
          ) : null}
          <h2 className="font-serif text-2xl leading-tight text-cream">{product.title}</h2>
          <div className="flex items-center gap-3">
            <PriceTag price={product.price} mrp={product.mrp} size="lg" />
            {off ? <span className="text-xs font-medium text-acid">{off}% off</span> : null}
          </div>
          {typeof product.rating === "number" ? (
            <RatingStars rating={product.rating} count={product.ratingCount} size={13} />
          ) : null}
        </div>

        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-pill bg-acid px-5 text-sm font-medium text-acid-ink transition-colors hover:bg-acid/90"
        >
          Open on {product.store}
          <ExternalLink aria-hidden className="h-4 w-4" />
        </a>

        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-[10px] uppercase tracking-[0.24em] text-muted">
              Across stores
            </h3>
            {cheapest && cheapest.price < product.price ? (
              <span className="text-[10px] uppercase tracking-[0.16em] text-acid">
                Save {formatINR(product.price - cheapest.price)}
              </span>
            ) : null}
          </div>
          {loading ? (
            <div className="flex items-center gap-2 py-4 text-muted">
              <Spinner className="h-4 w-4" />
              <span className="text-xs">Checking other stores…</span>
            </div>
          ) : comparison.length > 1 ? (
            <div className="flex flex-col gap-2">
              {comparison.slice(0, 6).map((entry) => (
                <PriceRow
                  key={entry.id}
                  product={entry}
                  active={(focused ?? product.id) === entry.id}
                  onSelect={(next) => setFocused(next.id)}
                />
              ))}
            </div>
          ) : (
            <p className="flex items-center gap-2 text-xs text-muted">
              <Check aria-hidden className="h-3.5 w-3.5 text-acid" />
              This is the only store listing we found.
            </p>
          )}
        </section>
      </div>
    </Sheet>
  );
}
