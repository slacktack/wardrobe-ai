// One-shot outfit pipeline: detect the items, then fetch ranked products for each.

import { extractOutfit } from "@/lib/extract";
import { searchProducts } from "@/lib/search";
import type { ExtractedItem, Product } from "@/lib/types";

const PER_ITEM_LIMIT = 6;
const MAX_PER_ITEM = 24;
const CONCURRENCY = 4;

export interface OutfitItemResult {
  item: ExtractedItem;
  products: Product[];
}

export interface OutfitOptions {
  perItem?: number;
}

export type OutfitOutcome =
  | { ok: true; items: OutfitItemResult[]; vibe?: string }
  | { ok: false; error: string };

export async function buildOutfit(
  image: string,
  options: OutfitOptions = {},
): Promise<OutfitOutcome> {
  const extracted = await extractOutfit(image);
  if (!extracted.ok) return { ok: false, error: extracted.error };

  const limit = clampPerItem(options.perItem);
  const items = await mapWithConcurrency(extracted.items, CONCURRENCY, async (item) => {
    const result = await searchProducts({
      query: item.searchQuery,
      category: item.category,
      limit,
    });
    return { item, products: result.ok ? result.products : [] };
  });

  const body: { ok: true; items: OutfitItemResult[]; vibe?: string } = { ok: true, items };
  if (extracted.vibe) body.vibe = extracted.vibe;
  return body;
}

function clampPerItem(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return PER_ITEM_LIMIT;
  return Math.min(MAX_PER_ITEM, Math.max(1, Math.trunc(numeric)));
}

// Bounded fan-out so a big outfit never bursts the search upstream.
async function mapWithConcurrency<T, R>(
  input: T[],
  size: number,
  fn: (value: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(input.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(size, input.length) }, async () => {
    while (cursor < input.length) {
      const index = cursor;
      cursor += 1;
      const value = input[index];
      if (value === undefined) continue;
      results[index] = await fn(value);
    }
  });
  await Promise.all(workers);
  return results;
}
