// POST /api/search — shoppable query -> ranked products.

import { clampLimit, normaliseCategory, normaliseGender, searchProducts } from "@/lib/search";
import type { SearchResponse } from "@/lib/types";

function jsonError(status: number, error: string): Response {
  const body: SearchResponse = { ok: false, products: [], error };
  return Response.json(body, { status });
}

export async function POST(request: Request): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonError(400, "Request body must be valid JSON.");
  }
  if (!isRecord(payload)) {
    return jsonError(400, "Request body must be a JSON object.");
  }
  const query = typeof payload.query === "string" ? payload.query.trim() : "";
  if (!query) {
    return jsonError(400, "`query` must be a non-empty string.");
  }
  const category = normaliseCategory(payload.category);
  const gender = normaliseGender(payload.gender);
  const limit = clampLimit(payload.limit);

  try {
    const result = await searchProducts({ query, category, gender, limit });
    if (!result.ok) {
      return jsonError(502, result.error);
    }
    const body: SearchResponse = { ok: true, products: result.products };
    if (result.note) body.note = result.note;
    if (result.categoryName) body.categoryName = result.categoryName;
    return Response.json(body);
  } catch {
    return jsonError(500, "Unexpected error while searching products.");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
