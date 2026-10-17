// Low-level client for the AIL vision chat completions API (OpenAI-compatible).

const CHAT_COMPLETIONS_URL =
  "https://ail.buyhatke.com/v1/opencode/chat/completions";

const VISION_MODEL = "deepseek-v4.1-flash-free";

const DEFAULT_TIMEOUT_MS = 45_000;

export class AilError extends Error {}

export interface VisionChatOptions {
  prompt: string;
  imageUrl?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
}

type ChatContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export async function visionChat(options: VisionChatOptions): Promise<string> {
  const { prompt, imageUrl, timeoutMs = DEFAULT_TIMEOUT_MS, signal } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const forwardAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", forwardAbort, { once: true });
  }
  try {
    const content: ChatContentPart[] = [{ type: "text", text: prompt }];
    if (imageUrl) {
      content.push({ type: "image_url", image_url: { url: imageUrl } });
    }
    const headers: Record<string, string> = {
      "content-type": "application/json",
    };
    const token = process.env.HATKE_API_TOKEN;
    if (token) {
      headers.authorization = `Bearer ${token}`;
    }
    const response = await fetch(CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [{ role: "user", content }],
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new AilError(
        `Vision model request failed (HTTP ${response.status})${detail ? `: ${detail.slice(0, 180)}` : ""}`,
      );
    }
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new AilError("Vision model returned an invalid response.");
    }
    const text = readAssistantText(payload);
    if (!text) {
      throw new AilError("Vision model returned an empty response.");
    }
    return text;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", forwardAbort);
  }
}

function readAssistantText(payload: unknown): string {
  if (!isRecord(payload)) return "";
  const choices = payload.choices;
  if (!Array.isArray(choices) || choices.length === 0) return "";
  const first: unknown = choices[0];
  if (!isRecord(first)) return "";
  const message = first.message;
  if (!isRecord(message)) return "";
  return textFromContent(message.content);
}

function textFromContent(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  let text = "";
  for (const part of content) {
    if (isRecord(part) && typeof part.text === "string") {
      text += part.text;
    }
  }
  return text.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
