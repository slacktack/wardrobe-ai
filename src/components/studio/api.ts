import type { ExtractedItem, Gender, Product } from "@/lib/types";

export type ExtractResult =
  | { ok: true; items: ExtractedItem[]; vibe?: string; gender?: Gender }
  | { ok: false; error: string };

export type SearchResult = { ok: true; products: Product[] } | { ok: false; error: string };

export async function postJson(url: string, body: unknown): Promise<unknown> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  try {
    return (await res.json()) as unknown;
  } catch {
    throw new Error(res.ok ? "Unexpected response from the server." : `Request failed (${res.status}).`);
  }
}

// Trusts the frozen API contract but still narrows the shape at runtime.
export function parseExtract(data: unknown): ExtractResult {
  if (typeof data !== "object" || data === null) {
    return { ok: false, error: "Unexpected response from the stylist." };
  }
  const record = data as Record<string, unknown>;
  if (record.ok === true && Array.isArray(record.items)) {
    return {
      ok: true,
      items: record.items as ExtractedItem[],
      vibe: typeof record.vibe === "string" && record.vibe ? record.vibe : undefined,
      gender: record.gender === "men" || record.gender === "women" ? record.gender : undefined,
    };
  }
  return {
    ok: false,
    error:
      typeof record.error === "string" && record.error
        ? record.error
        : "Could not read that photo. Try another one.",
  };
}

export function parseSearch(data: unknown): SearchResult {
  if (typeof data !== "object" || data === null) {
    return { ok: false, error: "Unexpected response from search." };
  }
  const record = data as Record<string, unknown>;
  if (record.ok === true && Array.isArray(record.products)) {
    return { ok: true, products: record.products as Product[] };
  }
  return {
    ok: false,
    error:
      typeof record.error === "string" && record.error ? record.error : "Search failed. Try again.",
  };
}
