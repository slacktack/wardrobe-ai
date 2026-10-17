"use client";

import type { ReactNode } from "react";
import { SearchX, type LucideIcon } from "lucide-react";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProductCard, type ProductCardVariant } from "@/components/product/ProductCard";

export function ProductCardSkeleton({
  variant = "grid",
  className,
}: {
  variant?: ProductCardVariant;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-card border border-line bg-surface",
        variant === "rail" && "w-[9.5rem] shrink-0",
        className,
      )}
    >
      <Skeleton className="aspect-[3/4] rounded-none" />
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className="h-3 w-4/5 rounded-pill" />
        <Skeleton className="h-3 w-3/5 rounded-pill" />
        <Skeleton className="mt-1 h-4 w-2/5 rounded-pill" />
      </div>
    </div>
  );
}

export function ProductGrid({
  products,
  loading = false,
  skeletonCount = 6,
  onPress,
  emptyTitle = "Nothing on the rack yet.",
  emptyDescription,
  emptyIcon,
  children,
  className,
}: {
  products: Product[];
  loading?: boolean;
  skeletonCount?: number;
  onPress?: (product: Product) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  children?: ReactNode;
  className?: string;
}) {
  if (loading) {
    return (
      <div className={cn("grid grid-cols-2 gap-3", className)}>
        {Array.from({ length: skeletonCount }, (_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon ?? SearchX}
        title={emptyTitle}
        description={emptyDescription}
        className={className}
      >
        {children}
      </EmptyState>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          onPress={onPress}
          priority={index < 4}
        />
      ))}
    </div>
  );
}
