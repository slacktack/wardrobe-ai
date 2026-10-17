// FROZEN CONTRACT — shared by API routes and UI. Do not edit without updating both sides.

export type ItemCategory =
  | "outerwear"
  | "top"
  | "bottom"
  | "shoes"
  | "accessory"
  | "other";

export type Gender = "men" | "women";

/** Normalised [x, y, w, h] of the item within the photo, each 0..1. */
export type ItemBox = [number, number, number, number];

export interface ExtractedItem {
  id: string;
  category: ItemCategory;
  name: string;
  description?: string;
  colors: string[];
  searchQuery: string;
  brand?: string;
  box?: ItemBox;
}

export interface Product {
  id: string;
  title: string;
  image: string;
  price: number;
  mrp?: number;
  url: string;
  store: string;
  storeIcon?: string;
  rating?: number;
  ratingCount?: number;
  siteCode?: number;
  brand?: string;
  matchType?: "exact" | "similar";
}

export interface ExtractRequest {
  /** data URL, e.g. "data:image/jpeg;base64,..." */
  image: string;
}

export interface ExtractResponse {
  ok: boolean;
  items: ExtractedItem[];
  vibe?: string;
  gender?: Gender;
  error?: string;
}

export interface SearchRequest {
  query: string;
  category?: ItemCategory;
  gender?: Gender;
  limit?: number;
}

export interface SearchResponse {
  ok: boolean;
  products: Product[];
  error?: string;
  note?: string;
  categoryName?: string;
}

export interface LensRequest {
  /** data URL of a cropped item image, e.g. "data:image/jpeg;base64,..." */
  image: string;
}

export interface LookPick {
  item: ExtractedItem;
  product: Product | null;
}

export interface Look {
  version: 1;
  id: string;
  createdAt: number;
  title: string;
  vibe?: string;
  picks: LookPick[];
}
