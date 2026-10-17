// POST /api/lens — cropped item image (data URL) -> visually-matched products.

import { searchProductsByImage } from "@/lib/lens";
import type { SearchResponse } from "@/lib/types";

const MAX_IMAGE_LENGTH = 4_000_000;

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
  const image = typeof payload.image === "string" ? payload.image.trim() : "";
  if (!image) {
    return jsonError(400, "`image` must be a non-empty string.");
  }
  if (image.length > MAX_IMAGE_LENGTH) {
    return jsonError(400, "`image` is too large.");
  }

  try {
    const result = await searchProductsByImage(image);
    if (!result.ok) {
      return jsonError(502, result.error);
    }
    const body: SearchResponse = { ok: true, products: result.products };
    return Response.json(body);
  } catch {
    return jsonError(500, "Unexpected error while searching by image.");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
