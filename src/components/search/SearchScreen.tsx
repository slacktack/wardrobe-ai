"use client";

import { useCallback, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Camera, Search, X } from "lucide-react";
import type { ItemCategory, Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useRecentSearches } from "@/lib/store";
import { downscaleToDataUrl } from "@/lib/image";
import { postJson, parseSearch } from "@/components/studio/api";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductSheet } from "@/components/product/ProductSheet";

const CATEGORIES: ReadonlyArray<{ value: ItemCategory | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "top", label: "Tops" },
  { value: "bottom", label: "Bottoms" },
  { value: "outerwear", label: "Outerwear" },
  { value: "shoes", label: "Shoes" },
  { value: "accessory", label: "Accessories" },
];

const SUGGESTIONS = [
  "white leather sneakers",
  "baggy jeans",
  "oversized denim jacket",
  "black sunglasses",
  "gold hoop earrings",
  "knit sweater",
];

function parseLens(data: unknown): { ok: true; products: Product[] } | { ok: false; error: string } {
  if (typeof data !== "object" || data === null) return { ok: false, error: "Image search failed." };
  const record = data as Record<string, unknown>;
  if (record.ok === true && Array.isArray(record.products)) {
    return { ok: true, products: record.products as Product[] };
  }
  return {
    ok: false,
    error: typeof record.error === "string" ? record.error : "Image search failed.",
  };
}

export function SearchScreen() {
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const [query, setQuery] = useState(initial);
  const [category, setCategory] = useState<ItemCategory | "all">("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(initial.trim().length > 0);
  const [visual, setVisual] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const { queries, add: addRecent } = useRecentSearches();
  const fileRef = useRef<HTMLInputElement>(null);

  const run = useCallback(
    async (text: string, nextCategory: ItemCategory | "all") => {
      const clean = text.trim();
      if (!clean) return;
      setLoading(true);
      setError(null);
      setSubmitted(true);
      setVisual(false);
      setPreview(null);
      addRecent(clean);
      try {
        const data = await postJson("/api/search", {
          query: clean,
          limit: 40,
          ...(nextCategory === "all" ? {} : { category: nextCategory }),
        });
        const result = parseSearch(data);
        if (!result.ok) {
          setError(result.error);
          setProducts([]);
          return;
        }
        setProducts(result.products);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed. Try again.");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [addRecent],
  );

  const handleFile = useCallback(async (file: File) => {
    try {
      const dataUrl = await downscaleToDataUrl(file);
      setPreview(dataUrl);
      setLoading(true);
      setError(null);
      setSubmitted(true);
      setVisual(true);
      const data = await postJson("/api/lens", { image: dataUrl });
      const result = parseLens(data);
      if (!result.ok) {
        setError(result.error);
        setProducts([]);
        return;
      }
      setProducts(result.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not search that photo.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setQuery("");
    setProducts([]);
    setError(null);
    setSubmitted(false);
    setVisual(false);
    setPreview(null);
  }, []);

  const closeSheet = useCallback(() => setSelected(null), []);

  return (
    <div className="flex flex-col gap-5 px-5 pb-32 pt-6">
      <header className="flex flex-col gap-1">
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted">Find a piece</p>
        <h1 className="font-serif text-4xl leading-none text-cream">Search</h1>
      </header>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void run(query, category);
        }}
        className="flex items-center gap-2"
      >
        <div className="flex min-h-12 flex-1 items-center gap-2 rounded-pill border border-line bg-surface px-4 focus-within:border-acid/60">
          <Search aria-hidden className="h-4 w-4 shrink-0 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try “white leather sneakers”"
            aria-label="Search products"
            enterKeyHint="search"
            className="min-w-0 flex-1 bg-transparent text-sm text-cream outline-none placeholder:text-muted"
          />
          {query ? (
            <button
              type="button"
              onClick={clear}
              aria-label="Clear search"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:text-cream"
            >
              <X aria-hidden className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label="Search by photo"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-cream transition-colors hover:border-acid/60"
        >
          <Camera aria-hidden className="h-5 w-5" strokeWidth={1.8} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
            event.target.value = "";
          }}
        />
      </form>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              setCategory(option.value);
              if (submitted && !visual) void run(query, option.value);
            }}
            className={cn(
              "rounded-pill border px-3.5 py-2 text-[11px] uppercase tracking-[0.16em] transition-colors",
              category === option.value
                ? "border-acid/60 bg-acid/10 text-acid"
                : "border-line text-muted hover:text-cream",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {!submitted && queries.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-[10px] uppercase tracking-[0.24em] text-muted">Recent</h2>
          <div className="flex flex-wrap gap-2">
            {queries.map((entry) => (
              <button
                key={entry}
                type="button"
                onClick={() => {
                  setQuery(entry);
                  void run(entry, category);
                }}
              >
                <Chip className="hover:text-cream">{entry}</Chip>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {!submitted ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-[10px] uppercase tracking-[0.24em] text-muted">Popular</h2>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((entry) => (
              <button
                key={entry}
                type="button"
                onClick={() => {
                  setQuery(entry);
                  void run(entry, category);
                }}
              >
                <Chip className="hover:text-cream">{entry}</Chip>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {visual && preview ? (
        <div className="flex items-center gap-3 rounded-card border border-line bg-surface p-3">
          <img
            src={preview}
            alt=""
            className="h-16 w-16 rounded-xl object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-acid">Visually similar</p>
            <p className="mt-1 text-xs text-muted">
              {loading ? "Reading the photo…" : `${products.length} matches found`}
            </p>
          </div>
        </div>
      ) : null}

      {error ? (
        <EmptyState
          title="Nothing came back."
          description={error}
          className="rounded-card border border-line bg-surface"
        >
          <Button variant="outline" onClick={() => void run(query, category)}>
            Try again
          </Button>
        </EmptyState>
      ) : (
        <ProductGrid
          products={products}
          loading={loading}
          skeletonCount={6}
          onPress={setSelected}
          emptyTitle={submitted ? "No matches for that." : "Search the racks."}
          emptyDescription={
            submitted
              ? "Try a simpler phrase, a colour, or a photo."
              : "Type a piece, tap a suggestion, or scan a photo to find lookalikes."
          }
        />
      )}

      <ProductSheet product={selected} onClose={closeSheet} />
    </div>
  );
}
