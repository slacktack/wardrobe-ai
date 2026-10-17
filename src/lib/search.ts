// Product search client: specDeals upstream, deal -> Product mapping.
// specDeals resolves category, colour intent and audience itself, so we pass the
// raw query through and let the API do the semantic filtering.

import type { Gender, ItemCategory, Product } from "@/lib/types";
import { rankProducts } from "@/lib/rank";

const SEARCH_ENDPOINT = "https://ln.buyhatke.com/deals/api/specDeals";

const SEARCH_TIMEOUT_MS = 15_000;
const DEFAULT_LIMIT = 24;
const MIN_LIMIT = 1;
const MAX_LIMIT = 60;
const UPSTREAM_LIMIT = 72;

const CATEGORY_SET = new Set<string>([
  "outerwear",
  "top",
  "bottom",
  "shoes",
  "accessory",
  "other",
]);

const STORE_MATCHERS: ReadonlyArray<readonly [RegExp, string]> = [
  [/(?:^|\.)amazon\./i, "Amazon"],
  [/(?:^|\.)flipkart\./i, "Flipkart"],
  [/(?:^|\.)nykaa\./i, "Nykaa"],
  [/(?:^|\.)myntra\./i, "Myntra"],
  [/(?:^|\.)ajio\./i, "AJIO"],
  [/(?:^|\.)tatacliq\./i, "Tata CLiQ"],
  [/(?:^|\.)snapdeal\./i, "Snapdeal"],
  [/(?:^|\.)meesho\./i, "Meesho"],
];

// Flipkart serves a generic lightning-bolt placeholder for listings without a photo.
const PLACEHOLDER_IMAGE = /\/www\/\d+\/\d+\/promos\//i;

class SearchError extends Error {}

export type SearchOutcome =
  | { ok: true; products: Product[]; note?: string; categoryName?: string }
  | { ok: false; error: string };

export interface SearchInput {
  query: string;
  category?: ItemCategory;
  gender?: Gender;
  limit: number;
}

export function clampLimit(value: unknown): number {
  if (value === undefined || value === null || value === "") return DEFAULT_LIMIT;
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, Math.trunc(numeric)));
}

export function normaliseCategory(value: unknown): ItemCategory | undefined {
  return typeof value === "string" && CATEGORY_SET.has(value)
    ? (value as ItemCategory)
    : undefined;
}

export function normaliseGender(value: unknown): Gender | undefined {
  return value === "men" || value === "women" ? value : undefined;
}

const GENDER_WORDS = /\b(men|mens|men's|man|male|boys?|women|womens|women's|woman|female|ladies|girls?|unisex|kids?)\b/i;

// specDeals resolves category and audience from the text, so a missing gender
// lets womenswear leak in (and starves results). Append it when absent.
export function withGender(query: string, gender?: Gender): string {
  if (!gender || GENDER_WORDS.test(query)) return query;
  return `${query} ${gender}`;
}

export async function searchProducts(input: SearchInput): Promise<SearchOutcome> {
  const params = new URLSearchParams({
    q: withGender(input.query, input.gender),
    mode: "full",
    country: "IN",
    limit: String(UPSTREAM_LIMIT),
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
  try {
    const response = await fetch(`${SEARCH_ENDPOINT}?${params.toString()}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) {
      throw new SearchError(`Product search failed (HTTP ${response.status}).`);
    }
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new SearchError("Product search returned an invalid response.");
    }
    const products = collectDeals(payload)
      .map(mapDeal)
      .filter((product): product is Product => product !== null);
    const ranked = rankProducts(products, { query: input.query, limit: input.limit, category: input.category });
    const outcome: SearchOutcome = { ok: true, products: ranked };
    const note = firstRelaxedNote(payload);
    if (note) outcome.note = note;
    const categoryName = understoodCategoryName(payload);
    if (categoryName) outcome.categoryName = categoryName;
    return outcome;
  } catch (error) {
    if (isAbortError(error)) {
      return { ok: false, error: "Product search timed out. Please try again." };
    }
    if (error instanceof SearchError) {
      return { ok: false, error: error.message };
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function collectDeals(payload: unknown): unknown[] {
  if (!isRecord(payload)) {
    throw new SearchError("Product search returned an unexpected response.");
  }
  const deals = payload.deals;
  return Array.isArray(deals) ? deals : [];
}

function mapDeal(raw: unknown): Product | null {
  if (!isRecord(raw)) return null;
  const id = asString(raw.pid).trim();
  const title = asString(raw.title).trim();
  const image = asString(raw.image).trim();
  const link = asString(raw.url).trim();
  if (!id || !title || !image || !link || PLACEHOLDER_IMAGE.test(image)) return null;

  const price = toFiniteNumber(raw.price) ?? 0;
  const host = hostnameOf(link);
  const product: Product = {
    id,
    title,
    image,
    price,
    url: link,
    store: asString(raw.platform).trim() || storeFromHost(host),
    matchType: raw.match === "exact" ? "exact" : "similar",
  };

  // `avg` is the reference price the API compares against; it powers the discount badge.
  const avg = toFiniteNumber(raw.avg);
  if (avg !== undefined && avg > price) product.mrp = Math.round(avg);
  const rating = toFiniteNumber(raw.rating);
  if (rating !== undefined) product.rating = rating;
  const ratingCount = toFiniteNumber(raw.ratingCount);
  if (ratingCount !== undefined) product.ratingCount = ratingCount;
  const brand = asString(raw.brand).trim();
  if (brand && brand.toLowerCase() !== "na") product.brand = brand;
  const siteCode = toFiniteNumber(raw.pos);
  if (siteCode !== undefined) product.siteCode = siteCode;
  const logo = asString(raw.platformLogo).trim();
  if (logo) {
    product.storeIcon = logo;
  } else if (host) {
    product.storeIcon = `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  }
  return product;
}

function firstRelaxedNote(payload: unknown): string | undefined {
  if (!isRecord(payload)) return undefined;
  const relaxed = payload.relaxed;
  if (!Array.isArray(relaxed)) return undefined;
  for (const entry of relaxed) {
    if (!isRecord(entry)) continue;
    const note = asString(entry.note).trim();
    if (note) return note;
  }
  return undefined;
}

function understoodCategoryName(payload: unknown): string | undefined {
  if (!isRecord(payload)) return undefined;
  const understood = payload.understood;
  if (!isRecord(understood)) return undefined;
  const category = understood.category;
  if (!isRecord(category)) return undefined;
  return asString(category.name).trim() || undefined;
}

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

export function storeFromHost(host: string): string {
  if (!host) return "Store";
  for (const [pattern, name] of STORE_MATCHERS) {
    if (pattern.test(host)) return name;
  }
  const bare = host.replace(/^www\./i, "");
  return bare.charAt(0).toUpperCase() + bare.slice(1);
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  }
  return undefined;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
