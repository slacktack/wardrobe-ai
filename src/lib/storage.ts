// FROZEN — versioned localStorage repo for saved looks. UI reads/writes through this only.

import type { Look } from "@/lib/types";

const LOOKS_KEY = "wardrobe.looks.v1";
const EVENT = "wardrobe:looks-changed";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getLooks(): Look[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(LOOKS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as Look[]).filter((l) => l && l.version === 1 && l.id);
  } catch {
    return [];
  }
}

export function getLook(id: string): Look | undefined {
  return getLooks().find((l) => l.id === id);
}

export function saveLook(look: Look): void {
  if (!isBrowser()) return;
  const looks = getLooks().filter((l) => l.id !== look.id);
  looks.unshift(look);
  window.localStorage.setItem(LOOKS_KEY, JSON.stringify(looks.slice(0, 100)));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function deleteLook(id: string): void {
  if (!isBrowser()) return;
  const looks = getLooks().filter((l) => l.id !== id);
  window.localStorage.setItem(LOOKS_KEY, JSON.stringify(looks));
  window.dispatchEvent(new CustomEvent(EVENT));
}

/** Subscribe to look changes. Returns unsubscribe. */
export function subscribeLooks(cb: () => void): () => void {
  if (!isBrowser()) return () => {};
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `l_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}
