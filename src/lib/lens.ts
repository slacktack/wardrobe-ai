// App Lens product search: cropped item image in, Product[] out.
// Uses Buyhatke's Amazon visual-lens proxy (app-bound credentials).

import { createHash } from "node:crypto";
import type { Product } from "@/lib/types";
import { hostnameOf, storeFromHost } from "@/lib/search";

const APP_LENS_BASE_URL = "https://ext1.buyhatke.com/extension-apis/appLens";
// 1 = Android, 2 = iOS (the upstream rejects the string "android").
const PLATFORM = process.env.APP_LENS_PLATFORM ?? "1";
const LENS_TIMEOUT_MS = 45_000;
const POLL_INTERVAL_MS = 1_500;
const MAX_POLLS = 14;

interface Credential {
  appId: string;
  appAuth: string;
}

const DEFAULT_CREDENTIALS: Credential[] = [
  { appId: "9032933", appAuth: "926923034" },
  { appId: "5674793", appAuth: "425558581" },
  { appId: "5674793", appAuth: "607669518" },
  { appId: "5401262", appAuth: "977164138" },
  { appId: "5401262", appAuth: "686424135" },
];

const envCredential: Credential[] =
  process.env.APP_LENS_APP_ID && process.env.APP_LENS_APP_AUTH
    ? [{ appId: process.env.APP_LENS_APP_ID, appAuth: process.env.APP_LENS_APP_AUTH }]
    : [];

const CREDENTIALS: Credential[] = [...envCredential, ...DEFAULT_CREDENTIALS];

const COOLDOWN_MS = 5 * 60_000;
const CRED_ATTEMPTS = 3;
const CRED_GAP_MS = 400;
const CACHE_TTL_MS = 10 * 60_000;
const CACHE_MAX_ENTRIES = 50;

const cooldownUntil = new Map<string, number>();
const resultCache = new Map<string, { at: number; products: Product[] }>();

type LensErrorKind = "rate" | "retry" | "fatal";

class LensError extends Error {
  constructor(message: string, readonly kind: LensErrorKind = "fatal") {
    super(message);
  }
}

export type LensOutcome =
  | { ok: true; products: Product[] }
  | { ok: false; error: string };

export async function searchProductsByImage(image: string): Promise<LensOutcome> {
  const { base64, mime } = splitDataUrl(image);
  if (!base64) {
    return { ok: false, error: "`image` must be a base64 data URL." };
  }

  const cacheKey = createHash("sha1").update(base64).digest("hex");
  const cached = resultCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return { ok: true, products: cached.products };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LENS_TIMEOUT_MS);
  let rateLimited = false;
  let lastMessage = "";
  try {
    for (const [index, credential] of candidateCredentials().entries()) {
      if (index > 0) await sleep(CRED_GAP_MS, controller.signal);
      try {
        const insertId = await uploadImage(credential, base64, mime, controller.signal);
        const products = await pollResults(credential, insertId, controller.signal);
        if (products.length === 0) {
          return { ok: false, error: "No matches found for this item." };
        }
        remember(cacheKey, products);
        return { ok: true, products };
      } catch (error) {
        if (error instanceof LensError && (error.kind === "rate" || error.kind === "retry")) {
          if (error.kind === "rate") rateLimited = true;
          lastMessage = error.message;
          penalise(credential);
          continue;
        }
        throw error;
      }
    }
    if (rateLimited) {
      return { ok: false, error: "Image search is busy right now. Please try again in a moment." };
    }
    return {
      ok: false,
      error: lastMessage
        ? `Image search is unavailable right now (${lastMessage}).`
        : "Image search is unavailable right now.",
    };
  } catch (error) {
    if (isAbortError(error)) {
      return { ok: false, error: "Image search timed out. Please try again." };
    }
    if (error instanceof LensError) {
      return { ok: false, error: error.message };
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// Fresh credentials first; ones cooling down from a 429 are tried last, if at all.
function candidateCredentials(): Credential[] {
  const now = Date.now();
  const ready = CREDENTIALS.filter((credential) => cooldownOf(credential) <= now);
  const cooling = CREDENTIALS.filter((credential) => cooldownOf(credential) > now).sort(
    (a, b) => cooldownOf(a) - cooldownOf(b),
  );
  return [...ready, ...cooling].slice(0, CRED_ATTEMPTS);
}

function cooldownOf(credential: Credential): number {
  return cooldownUntil.get(credentialKey(credential)) ?? 0;
}

function penalise(credential: Credential): void {
  cooldownUntil.set(credentialKey(credential), Date.now() + COOLDOWN_MS);
}

function credentialKey(credential: Credential): string {
  return `${credential.appId}:${credential.appAuth}`;
}

function remember(key: string, products: Product[]): void {
  resultCache.set(key, { at: Date.now(), products });
  if (resultCache.size > CACHE_MAX_ENTRIES) {
    const oldest = resultCache.keys().next().value;
    if (oldest !== undefined) resultCache.delete(oldest);
  }
}

function splitDataUrl(image: string): { base64: string; mime: string } {
  const trimmed = image.trim();
  const match = /^data:(image\/[a-z0-9.+-]+);base64,([\s\S]+)$/i.exec(trimmed);
  if (match) return { mime: match[1], base64: match[2] };
  if (/^https?:\/\//i.test(trimmed)) return { mime: "image/jpeg", base64: "" };
  return { mime: "image/jpeg", base64: trimmed.replace(/\s+/g, "") };
}

async function uploadImage(
  credential: Credential,
  base64: string,
  mime: string,
  signal: AbortSignal,
): Promise<number> {
  const form = new FormData();
  form.append(
    "image",
    new Blob([Buffer.from(base64, "base64")], { type: mime }),
    "image.jpg",
  );
  form.append("appId", credential.appId);
  form.append("appAuth", credential.appAuth);
  form.append("platform", PLATFORM);

  const response = await fetch(`${APP_LENS_BASE_URL}/uploadImageForAppLens`, {
    method: "POST",
    body: form,
    signal,
    cache: "no-store",
  });
  if (response.status === 429) {
    throw new LensError("Rate limited by the image search upstream.", "rate");
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new LensError("Image search returned an invalid response.");
  }
  if (!isRecord(payload) || Number(payload.status) !== 1) {
    const message =
      (isRecord(payload) && typeof payload.msg === "string" && payload.msg) ||
      "Could not upload the image for search.";
    throw new LensError(message, "retry");
  }
  const insertId = Number(payload.insertId);
  if (!Number.isFinite(insertId) || insertId <= 0) {
    throw new LensError("Could not upload the image for search.");
  }
  return insertId;
}

async function pollResults(
  credential: Credential,
  insertId: number,
  signal: AbortSignal,
): Promise<Product[]> {
  for (let attempt = 0; attempt < MAX_POLLS; attempt += 1) {
    await sleep(POLL_INTERVAL_MS, signal);
    const url = new URL(`${APP_LENS_BASE_URL}/getAPPLensResults`);
    url.searchParams.set("id", String(insertId));
    url.searchParams.set("appId", credential.appId);
    url.searchParams.set("appAuth", credential.appAuth);
    url.searchParams.set("platform", PLATFORM);

    const response = await fetch(url.toString(), { signal, cache: "no-store" });
    if (response.status === 429) {
      throw new LensError("Rate limited by the image search upstream.", "rate");
    }
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      continue;
    }
    if (!isRecord(payload)) continue;
    if (Number(payload.status) === 1 && isRecord(payload.data)) {
      const products = extractProducts(payload.data);
      if (products.length > 0) return products;
    }
    if (typeof payload.msg === "string" && payload.msg === "Not found") {
      throw new LensError("Image search request expired. Please try again.", "retry");
    }
  }
  return [];
}

function extractProducts(data: Record<string, unknown>): Product[] {
  const raw = Array.isArray(data.products) ? data.products : [];
  const seen = new Set<string>();
  const products: Product[] = [];
  for (const entry of raw) {
    const product = mapProduct(entry);
    if (!product || seen.has(product.id)) continue;
    seen.add(product.id);
    products.push(product);
  }
  return products.sort(compareProducts);
}

function mapProduct(raw: unknown): Product | null {
  if (!isRecord(raw)) return null;
  const id = asString(raw.pid).trim();
  const title = asString(raw.prod).trim();
  const image = asString(raw.imageUrl).trim() || asString(raw.image).trim();
  const url = asString(raw.link).trim();
  if (!id || !title || !image || !url) return null;

  const host = hostnameOf(url);
  const product: Product = {
    id,
    title,
    image,
    price: toPrice(raw.price),
    url,
    store: storeFromHost(host),
  };
  if (host) {
    product.storeIcon = `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  }
  const rating = toFiniteNumber(raw.rating);
  if (rating !== undefined) product.rating = rating;
  return product;
}

function compareProducts(a: Product, b: Product): number {
  const ratingA = a.rating ?? -1;
  const ratingB = b.rating ?? -1;
  if (ratingA !== ratingB) return ratingB - ratingA;
  return a.price - b.price;
}

function toPrice(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const numeric = Number(value.replace(/[^0-9.]/g, ""));
    return Number.isFinite(numeric) ? numeric : 0;
  }
  return 0;
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

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    }
    signal.addEventListener("abort", onAbort, { once: true });
  });
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
