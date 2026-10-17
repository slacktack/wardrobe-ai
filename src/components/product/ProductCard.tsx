"use client";

import { Heart } from "lucide-react";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useSavedProducts } from "@/lib/store";
import { IconButton } from "@/components/ui/IconButton";
import { PriceTag } from "@/components/ui/PriceTag";
import { RatingStars } from "@/components/ui/RatingStars";
import { StoreBadge } from "@/components/ui/StoreBadge";
import { ProductImage } from "@/components/product/ProductImage";

export type ProductCardVariant = "grid" | "rail";

const GRID_SIZES = "(max-width: 430px) 47vw, 190px";
const RAIL_SIZES = "152px";

function SaveButton({ product }: { product: Product }) {
  const { isSaved, toggle } = useSavedProducts();
  const saved = isSaved(product.id);

  return (
    <IconButton
      label={saved ? `Remove ${product.title} from saved` : `Save ${product.title}`}
      aria-pressed={saved}
      size="sm"
      variant="glass"
      onClick={() => toggle(product)}
      className="absolute right-2 top-2 z-20"
    >
      <Heart
        aria-hidden
        className={cn("h-[18px] w-[18px]", saved && "fill-accent text-accent")}
        strokeWidth={saved ? 2 : 1.8}
      />
    </IconButton>
  );
}

export function ProductCard({
  product,
  variant = "grid",
  onPress,
  priority = false,
  className,
}: {
  product: Product;
  variant?: ProductCardVariant;
  onPress?: (product: Product) => void;
  priority?: boolean;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-card border border-line bg-surface transition-colors duration-200 hover:border-cream/20",
        variant === "rail" && "w-[9.5rem] shrink-0",
        className,
      )}
    >
      {onPress ? (
        <button
          type="button"
          onClick={() => onPress(product)}
          aria-label={`Select ${product.title}`}
          className="absolute inset-0 z-10 rounded-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 active:bg-cream/[0.03]"
        />
      ) : (
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${product.title} on ${product.store}`}
          className="absolute inset-0 z-10 rounded-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 active:bg-cream/[0.03]"
        />
      )}

      <div className="relative aspect-[3/4] overflow-hidden bg-surface-2">
        <ProductImage
          src={product.image}
          sizes={variant === "grid" ? GRID_SIZES : RAIL_SIZES}
          priority={priority}
        />
        <SaveButton product={product} />
      </div>

      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          variant === "grid" ? "gap-1.5 p-3" : "gap-1 p-2.5",
        )}
      >
        <h3 className="line-clamp-2 text-xs leading-snug text-cream">{product.title}</h3>
        {product.brand ? (
          <p className="truncate text-[9px] uppercase tracking-[0.18em] text-muted">
            {product.brand}
          </p>
        ) : null}
        <PriceTag price={product.price} mrp={product.mrp} size="sm" />
        <div className="mt-auto flex min-w-0 items-center justify-between gap-2 pt-1">
          {typeof product.rating === "number" ? (
            <RatingStars
              rating={product.rating}
              count={product.ratingCount}
              size={variant === "grid" ? 11 : 10}
            />
          ) : (
            <span aria-hidden />
          )}
          <StoreBadge store={product.store} className="max-w-[55%]" />
        </div>
      </div>
    </article>
  );
}
