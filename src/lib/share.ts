// Look sharing: compact base64url payloads in the URL, decoded without ever throwing.

import type {
  ExtractedItem,
  ItemCategory,
  Look,
  LookPick,
  Product,
} from "@/lib/types";

// Above this many characters a share link risks being cut off by chat clients.
export const SHARE_MAX_LENGTH = 6000;

// Minified transport shape - only what the shared page renders.
interface MiniPick {
  n: string;
  k: string;
  i?: string;
  w?: string;
  r?: number;
  m?: number;
  u?: string;
  s?: string;
}

interface MiniLook {
  t: string;
  v?: string;
  c: number;
  p: MiniPick[];
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCategory(value: unknown): value is ItemCategory {
  return (
    value === "outerwear" ||
    value === "top" ||
    value === "bottom" ||
    value === "shoes" ||
    value === "accessory" ||
    value === "other"
  );
}

function toBase64Url(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(encoded: string): string | null {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

function minifyPick(pick: LookPick): MiniPick {
  const mini: MiniPick = { n: pick.item.name, k: pick.item.category };
  const product = pick.product;
  if (product) {
    mini.i = product.image;
    mini.w = product.title;
    mini.r = product.price;
    if (isNumber(product.mrp)) mini.m = product.mrp;
    mini.u = product.url;
    mini.s = product.store;
  }
  return mini;
}

export function encodeLook(look: Look): string {
  const mini: MiniLook = {
    t: isString(look.title) && look.title.trim() ? look.title : "Untitled look",
    c: isNumber(look.createdAt) ? look.createdAt : Date.now(),
    p: Array.isArray(look.picks) ? look.picks.map(minifyPick) : [],
  };
  if (isString(look.vibe) && look.vibe.trim()) mini.v = look.vibe;
  return toBase64Url(JSON.stringify(mini));
}

function rebuildProduct(
  entry: Record<string, unknown>,
  index: number,
): Product | null {
  const image = entry.i;
  const title = entry.w;
  const price = entry.r;
  const url = entry.u;
  if (!isString(image) || !isString(title) || !isNumber(price) || !isString(url)) {
    return null;
  }
  const product: Product = {
    id: `shared_p${index}`,
    title,
    image,
    price,
    url,
    store: isString(entry.s) && entry.s ? entry.s : "Store",
  };
  if (isNumber(entry.m) && entry.m > price) product.mrp = entry.m;
  return product;
}

function rebuildPick(entry: unknown, index: number): LookPick | null {
  if (!isRecord(entry) || !isString(entry.n) || !isString(entry.k)) return null;
  const name = entry.n;
  const item: ExtractedItem = {
    id: `shared_${index}`,
    category: isCategory(entry.k) ? entry.k : "other",
    name,
    colors: [],
    searchQuery: name,
  };
  return { item, product: rebuildProduct(entry, index) };
}

export function decodeLook(encoded: string): Look | null {
  if (!isString(encoded) || encoded.length === 0) return null;
  try {
    const json = fromBase64Url(encoded);
    if (json === null) return null;
    const raw: unknown = JSON.parse(json);
    if (!isRecord(raw)) return null;
    if (!isString(raw.t) || !isNumber(raw.c) || !Array.isArray(raw.p)) {
      return null;
    }
    const picks: LookPick[] = [];
    for (let i = 0; i < raw.p.length; i += 1) {
      const pick = rebuildPick(raw.p[i], i);
      if (!pick) return null;
      picks.push(pick);
    }
    const look: Look = {
      version: 1,
      id: "shared",
      createdAt: raw.c,
      title: raw.t.trim() ? raw.t : "Untitled look",
      picks,
    };
    if (isString(raw.v) && raw.v.trim()) look.vibe = raw.v;
    return look;
  } catch {
    return null;
  }
}

export function lookShareUrl(look: Look, origin: string): string {
  const base = origin.replace(/\/+$/, "");
  return `${base}/share/${encodeLook(look)}`;
}

export function shareLength(look: Look): number {
  return encodeLook(look).length;
}

export function isShareable(look: Look): boolean {
  return shareLength(look) <= SHARE_MAX_LENGTH;
}
