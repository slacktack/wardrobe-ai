// Outfit-photo orchestration: prompt, upstream call, robust parsing, normalisation.

import { AilError, visionChat } from "@/lib/ail";
import type { ExtractedItem, Gender, ItemBox, ItemCategory } from "@/lib/types";

const EXTRACT_TIMEOUT_MS = 45_000;
const MAX_IMAGE_BYTES = 8_000_000;
const REPAIR_SNIPPET_LIMIT = 4_000;

const CATEGORY_SET = new Set<string>([
  "outerwear",
  "top",
  "bottom",
  "shoes",
  "accessory",
  "other",
]);

export type ExtractSuccess = {
  ok: true;
  items: ExtractedItem[];
  vibe?: string;
  gender?: Gender;
};

export type ExtractOutcome = ExtractSuccess | { ok: false; error: string };

const EXTRACT_PROMPT = `You are a fashion vision analyst. Analyse the person(s) in the photo and list EVERY visible clothing item and accessory.

Reply with ONLY minified JSON, no markdown fences and no prose, in exactly this shape:
{"vibe":"<2-6 word style vibe>","gender":"men|women","items":[{"category":"outerwear|top|bottom|shoes|accessory|other","name":"<short item name>","brand":"<brand, or empty string>","description":"<one short sentence>","colors":["<colour>"],"searchQuery":"<short shoppable query>","box":[x,y,w,h]}]}

Rules:
- Include EVERY visible item: tops, bottoms, outerwear, footwear, and ALL accessories (bags/totes, sunglasses, necklaces, rings, belts, hats, watches, scarves, earrings).
- ONLY list items you can actually SEE in the photo. Never invent footwear or accessories that are not visible.
- "category" must be exactly one of: outerwear, top, bottom, shoes, accessory, other.
- "brand" is the brand when the item is clearly branded (e.g. Nike, Levi's, Zara, Ray-Ban, Puma), otherwise "".
- "searchQuery" must be a short shoppable query, brand-first when the brand is known, then colour + garment, e.g. "Nike white leather sneakers", "Levi's light blue baggy jeans", "green mohair knit sweater", "green chevron tote bag".
- "colors" is always an array of lowercase colour names, [] when unclear.
- "box" is the item's bounding box as NORMALISED fractions of the image: x,y = top-left corner (0..1), w,h = width and height (0..1). Estimate where the item sits on the person.
- "gender" is who the outfit is styled for: "men" or "women" (the main person's presentation). Never leave it out.
- "vibe" describes the overall outfit style in 2-6 words, e.g. "minimal streetwear".`;

class ExtractError extends Error {}

export async function extractOutfit(image: string): Promise<ExtractOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EXTRACT_TIMEOUT_MS);
  try {
    const raw = await runExtraction(image, controller.signal);
    const parsed = await parseOrRepair(raw, controller.signal);
    if (!parsed) {
      return { ok: false, error: "Vision model did not return valid JSON." };
    }
    const normalised = normaliseExtraction(parsed);
    if (normalised.items.length === 0) {
      return { ok: false, error: "No clothing items were detected in the photo." };
    }
    return normalised;
  } catch (error) {
    if (isAbortError(error)) {
      return { ok: false, error: "Extraction timed out. Try a smaller photo." };
    }
    if (error instanceof AilError || error instanceof ExtractError) {
      return { ok: false, error: error.message };
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function runExtraction(image: string, signal: AbortSignal): Promise<string> {
  if (!/^https?:\/\//i.test(image)) {
    return visionChat({ prompt: EXTRACT_PROMPT, imageUrl: image, signal });
  }
  try {
    return await visionChat({ prompt: EXTRACT_PROMPT, imageUrl: image, signal });
  } catch (error) {
    if (signal.aborted) throw error;
    const dataUrl = await fetchAsDataUrl(image, signal);
    return visionChat({ prompt: EXTRACT_PROMPT, imageUrl: dataUrl, signal });
  }
}

async function fetchAsDataUrl(url: string, signal: AbortSignal): Promise<string> {
  const response = await fetch(url, { signal, redirect: "follow", cache: "no-store" });
  if (!response.ok) {
    throw new ExtractError(`Could not fetch the image (HTTP ${response.status}).`);
  }
  const contentType = (response.headers.get("content-type") ?? "")
    .split(";")[0]
    .trim();
  if (contentType && !contentType.startsWith("image/")) {
    throw new ExtractError("The provided URL did not return an image.");
  }
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new ExtractError("The image is too large to process.");
  }
  const base64 = Buffer.from(bytes).toString("base64");
  return `data:${contentType || "image/jpeg"};base64,${base64}`;
}

async function parseOrRepair(
  raw: string,
  signal: AbortSignal,
): Promise<Record<string, unknown> | null> {
  const direct = parseJsonObject(raw);
  if (direct) return direct;
  if (signal.aborted) return null;
  const repaired = await visionChat({ prompt: repairPrompt(raw), signal });
  return parseJsonObject(repaired);
}

function repairPrompt(badOutput: string): string {
  return `Your previous reply was not valid JSON. Reply with ONLY the corrected minified JSON object, no markdown fences and no prose.\nPrevious reply:\n${badOutput.slice(0, REPAIR_SNIPPET_LIMIT)}`;
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const parsed: unknown = JSON.parse(cleaned.slice(start, end + 1));
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function normaliseExtraction(parsed: Record<string, unknown>): ExtractSuccess {
  const vibe = asTrimmedString(parsed.vibe);
  const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
  const items: ExtractedItem[] = [];
  for (const entry of rawItems) {
    const item = normaliseItem(entry, items.length + 1);
    if (item) items.push(item);
  }
  const rawGender = asTrimmedString(parsed.gender).toLowerCase();
  const gender: Gender | undefined = /^(women|woman|female|womens|girl)/.test(rawGender)
    ? "women"
    : /^(men|man|male|mens|boy)/.test(rawGender)
      ? "men"
      : undefined;
  const result: ExtractSuccess = { ok: true, items };
  if (vibe) result.vibe = vibe;
  if (gender) result.gender = gender;
  return result;
}

function normaliseItem(entry: unknown, index: number): ExtractedItem | null {
  if (!isRecord(entry)) return null;
  const name = asTrimmedString(entry.name);
  if (!name) return null;
  const colors = Array.isArray(entry.colors)
    ? entry.colors
        .filter((color): color is string => typeof color === "string")
        .map((color) => color.trim())
        .filter((color) => color !== "")
    : [];
  const fallbackQuery = colors.length > 0 ? `${colors[0]} ${name}` : name;
  const item: ExtractedItem = {
    id: `item-${index}`,
    category: coerceCategory(entry.category),
    name,
    colors,
    searchQuery: asTrimmedString(entry.searchQuery) || fallbackQuery,
  };
  const description = asTrimmedString(entry.description);
  if (description) item.description = description;
  const brand = asTrimmedString(entry.brand);
  if (brand) item.brand = brand;
  const box = normaliseBox(entry.box);
  if (box) item.box = box;
  return item;
}

function normaliseBox(value: unknown): ItemBox | undefined {
  if (!Array.isArray(value) || value.length !== 4) return undefined;
  const nums = value.map((n) => (typeof n === "number" ? n : Number(n)));
  if (!nums.every((n) => Number.isFinite(n) && n >= 0 && n <= 1)) return undefined;
  const [x, y, w, h] = nums;
  if (w <= 0 || h <= 0 || x >= 1 || y >= 1) return undefined;
  return [x, y, w, h];
}

function coerceCategory(value: unknown): ItemCategory {
  const candidate = asTrimmedString(value).toLowerCase();
  return CATEGORY_SET.has(candidate) ? (candidate as ItemCategory) : "other";
}

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
