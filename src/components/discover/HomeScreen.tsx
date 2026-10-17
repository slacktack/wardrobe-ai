"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Camera, Images, Sparkles } from "lucide-react";
import type { Product } from "@/lib/types";
import { useSavedLooks } from "@/lib/store";
import { postJson, parseSearch } from "@/components/studio/api";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductCardSkeleton } from "@/components/product/ProductGrid";
import { ProductSheet } from "@/components/product/ProductSheet";

const RAILS = [
  { label: "White leather sneakers", query: "white leather sneakers" },
  { label: "Baggy jeans", query: "light blue baggy jeans" },
  { label: "Oversized jackets", query: "oversized denim jacket" },
  { label: "Black sunglasses", query: "black oval sunglasses" },
  { label: "Gold hoops", query: "gold hoop earrings" },
];

type Rails = Record<string, Product[]>;

export function HomeScreen() {
  const [rails, setRails] = useState<Rails>({});
  const [selected, setSelected] = useState<Product | null>(null);
  const { looks, ready } = useSavedLooks();

  useEffect(() => {
    let live = true;
    for (const rail of RAILS) {
      void postJson("/api/search", { query: rail.query, limit: 8 })
        .then((data) => {
          if (!live) return;
          const result = parseSearch(data);
          if (!result.ok) return;
          setRails((current) => ({ ...current, [rail.label]: result.products }));
        })
        .catch(() => undefined);
    }
    return () => {
      live = false;
    };
  }, []);

  const closeSheet = useCallback(() => setSelected(null), []);
  const recentLooks = looks.slice(0, 6);

  return (
    <div className="flex flex-col pb-32">
      <section className="relative overflow-hidden px-5 pb-8 pt-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-acid/10 blur-3xl"
        />
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted">Your wardrobe, decoded</p>
        <h1 className="mt-4 font-serif text-[2.9rem] leading-[0.98] text-cream">
          Photograph the fit.
          <br />
          <span className="italic text-acid">Own</span> every piece.
        </h1>
        <p className="mt-4 max-w-[32ch] text-sm leading-relaxed text-muted">
          Snap an outfit and we spot each garment, then hunt the exact pieces across the stores you
          already shop.
        </p>
        <div className="mt-7 flex flex-col gap-3">
          <Link href="/studio" className="contents">
            <Button size="lg" className="w-full">
              <Camera aria-hidden className="h-4 w-4" />
              Scan a fit
            </Button>
          </Link>
          <Link href="/search" className="contents">
            <Button size="lg" variant="outline" className="w-full">
              <Sparkles aria-hidden className="h-4 w-4" />
              Search by name or photo
            </Button>
          </Link>
        </div>
      </section>

      {ready && recentLooks.length > 0 ? (
        <section className="flex flex-col gap-3 pb-8">
          <header className="flex items-center justify-between px-5">
            <h2 className="text-[10px] uppercase tracking-[0.24em] text-muted">Your lookbooks</h2>
            <Link
              href="/saved"
              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-acid"
            >
              See all <ArrowRight aria-hidden className="h-3 w-3" />
            </Link>
          </header>
          <div className="snap-row gap-3 px-5 pb-1">
            {recentLooks.map((look) => {
              const hero = look.picks.find((pick) => pick.product)?.product;
              return (
                <Link
                  key={look.id}
                  href="/saved"
                  className="relative flex h-40 w-32 shrink-0 flex-col justify-end overflow-hidden rounded-card border border-line bg-surface-2 p-3"
                >
                  {hero ? (
                    <img
                      src={hero.image}
                      alt=""
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 h-full w-full object-cover opacity-80"
                    />
                  ) : null}
                  <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
                  <span className="relative line-clamp-2 text-[11px] font-medium text-cream">
                    {look.vibe ?? look.title}
                  </span>
                  <span className="relative mt-0.5 text-[9px] uppercase tracking-[0.16em] text-muted">
                    {look.picks.filter((pick) => pick.product).length} pieces
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-6 pb-6 pt-2">
        <div className="flex flex-col gap-2 px-5">
          <h2 className="font-serif text-2xl text-cream">Shop the edit</h2>
          <div className="flex flex-wrap gap-2">
            <Chip>High ratings only</Chip>
            <Chip>Multi-store prices</Chip>
          </div>
        </div>

        {RAILS.map((rail) => {
          const products = rails[rail.label];
          return (
            <div key={rail.label} className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-5">
                <h3 className="text-sm text-cream">{rail.label}</h3>
                <Link
                  href={`/search?q=${encodeURIComponent(rail.query)}`}
                  className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-muted transition-colors hover:text-acid"
                >
                  More <ArrowRight aria-hidden className="h-3 w-3" />
                </Link>
              </div>
              <div className="snap-row gap-3 px-5 pb-1">
                {products
                  ? products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        variant="rail"
                        onPress={setSelected}
                      />
                    ))
                  : Array.from({ length: 3 }, (_, index) => (
                      <ProductCardSkeleton key={index} variant="rail" />
                    ))}
              </div>
            </div>
          );
        })}
      </section>

      <section className="mx-5 flex items-center gap-3 rounded-card border border-line bg-surface p-4">
        <Images aria-hidden className="h-5 w-5 shrink-0 text-acid" strokeWidth={1.6} />
        <p className="text-xs leading-relaxed text-muted">
          Found a look you love on the feed? Screenshot it and scan — same result.
        </p>
      </section>

      <ProductSheet product={selected} onClose={closeSheet} />
    </div>
  );
}
