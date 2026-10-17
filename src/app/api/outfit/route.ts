// POST /api/outfit — outfit photo -> detected items, each with ranked products.

import { buildOutfit } from "@/lib/outfit";

const MAX_IMAGE_LENGTH = 8_000_000;

function jsonError(status: number, error: string): Response {
  return Response.json({ ok: false, items: [], error }, { status });
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
  const perItem = typeof payload.perItem === "number" ? payload.perItem : undefined;

  try {
    const result = await buildOutfit(image, { perItem });
    if (!result.ok) {
      return jsonError(502, result.error);
    }
    const body: { ok: true; items: typeof result.items; vibe?: string } = {
      ok: true,
      items: result.items,
    };
    if (result.vibe) body.vibe = result.vibe;
    return Response.json(body);
  } catch {
    return jsonError(500, "Unexpected error while building the outfit.");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
