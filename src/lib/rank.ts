// Ranking: specDeals already filters by category/audience; we score on top so the
// first product is the best example (exact, on-colour, well-rated, discounted).

import type { ItemCategory, Product } from "@/lib/types";

const DEFAULT_LIMIT = 24;

export interface RankOptions {
  query?: string;
  limit?: number;
  category?: ItemCategory;
}

const STOP = new Set(["men", "mens", "women", "womens", "for", "and", "with", "the"]);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP.has(word));
}

function score(product: Product, queryTokens: string[]): number {
  const title = product.title.toLowerCase();
  const overlap = queryTokens.filter((token) => title.includes(token)).length;
  let total = queryTokens.length > 0 ? (overlap / queryTokens.length) * 50 : 0;
  if (product.matchType === "exact") total += 30;
  if (typeof product.rating === "number") {
    const weight = Math.min(1, Math.log10((product.ratingCount ?? 0) + 1) / 3);
    total += (product.rating / 5) * 12 * (0.4 + 0.6 * weight);
  }
  if (product.mrp && product.mrp > product.price) {
    total += Math.min(8, ((product.mrp - product.price) / product.mrp) * 20);
  }
  if (product.price <= 0) total -= 40;
  return total;
}

export function rankProducts(products: Product[], options: RankOptions = {}): Product[] {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const queryTokens = tokens(options.query ?? "");
  const scored = dedupe(products)
    .map((product, index) => ({ product, index, value: score(product, queryTokens) }))
    .sort((a, b) => b.value - a.value || a.index - b.index);
  return scored.slice(0, limit).map((entry) => entry.product);
}

function dedupe(products: Product[]): Product[] {
  const seenTitles = new Set<string>();
  const seenIds = new Set<string>();
  const unique: Product[] = [];
  for (const product of products) {
    if (seenIds.has(product.id)) continue;
    const key = product.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
    if (key && seenTitles.has(key)) continue;
    seenIds.add(product.id);
    if (key) seenTitles.add(key);
    unique.push(product);
  }
  return unique;
}
