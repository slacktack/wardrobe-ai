// POST /api/extract — outfit photo (data URL or https URL) -> clothing items.

import { extractOutfit } from "@/lib/extract";
import type { ExtractResponse } from "@/lib/types";

const MAX_IMAGE_LENGTH = 8_000_000;

function jsonError(status: number, error: string): Response {
  const body: ExtractResponse = { ok: false, items: [], error };
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
    const result = await extractOutfit(image);
    if (!result.ok) {
      return jsonError(502, result.error);
    }
    const body: ExtractResponse = { ok: true, items: result.items };
    if (result.vibe) body.vibe = result.vibe;
    if (result.gender) body.gender = result.gender;
    return Response.json(body);
  } catch {
    return jsonError(500, "Unexpected error while extracting items.");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
