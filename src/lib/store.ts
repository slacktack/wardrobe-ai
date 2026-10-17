"use client";

// Local-first client state. Hooks hydrate from localStorage in an effect, stay in
// sync across components and tabs, and never produce hydration mismatches.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Look, Product } from "@/lib/types";
import { deleteLook, getLook, getLooks, saveLook, subscribeLooks } from "@/lib/storage";
import {
  THEME_KEY,
  applyTheme,
  readThemePref,
  resolveTheme,
  writeThemePref,
  type ResolvedTheme,
  type ThemePref,
} from "@/lib/theme";

export type { ResolvedTheme, ThemePref };

const EVENT = "wardrobe:store-changed";

const PRODUCTS_KEY = "wardrobe:saved-products:v1";
const PROFILE_KEY = "wardrobe:style-profile:v1";
const SEARCHES_KEY = "wardrobe:recent-searches:v1";

const MAX_SAVED_PRODUCTS = 200;
const MAX_RECENT_SEARCHES = 12;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readJson(key: string): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota or privacy mode: the in-memory copy keeps working.
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { key } }));
}

function subscribeKey(key: string, listener: () => void): () => void {
  const onLocal = (event: Event) => {
    const detail = (event as CustomEvent<{ key?: string }>).detail;
    if (!detail || detail.key === key) listener();
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === key) listener();
  };
  window.addEventListener(EVENT, onLocal);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, onLocal);
    window.removeEventListener("storage", onStorage);
  };
}

function usePersisted<T>(
  key: string,
  fallback: T,
  parse: (raw: unknown) => T | null,
): [T, (next: T | ((current: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);
  const latest = useRef(value);

  useEffect(() => {
    const sync = () => {
      const parsed = parse(readJson(key));
      const next = parsed ?? fallback;
      latest.current = next;
      setValue(next);
    };
    sync();
    setReady(true);
    return subscribeKey(key, sync);
  }, [key, fallback, parse]);

  const set = useCallback(
    (next: T | ((current: T) => T)) => {
      const resolved =
        typeof next === "function" ? (next as (current: T) => T)(latest.current) : next;
      latest.current = resolved;
      writeJson(key, resolved);
      setValue(resolved);
    },
    [key],
  );

  return [value, set, ready];
}

function parseProductArray(raw: unknown): Product[] | null {
  if (!Array.isArray(raw)) return null;
  const products: Product[] = [];
  for (const entry of raw) {
    if (!isRecord(entry)) continue;
    if (typeof entry.id !== "string" || typeof entry.title !== "string") continue;
    if (typeof entry.image !== "string" || typeof entry.url !== "string") continue;
    if (typeof entry.price !== "number" || typeof entry.store !== "string") continue;
    products.push(entry as unknown as Product);
  }
  return products;
}

const EMPTY_PRODUCTS: Product[] = [];

export function useSavedProducts() {
  const [products, setProducts, ready] = usePersisted<Product[]>(
    PRODUCTS_KEY,
    EMPTY_PRODUCTS,
    parseProductArray,
  );

  const isSaved = useCallback((id: string) => products.some((p) => p.id === id), [products]);

  const toggle = useCallback(
    (product: Product) => {
      setProducts((current) =>
        current.some((p) => p.id === product.id)
          ? current.filter((p) => p.id !== product.id)
          : [product, ...current].slice(0, MAX_SAVED_PRODUCTS),
      );
    },
    [setProducts],
  );

  const remove = useCallback(
    (id: string) => {
      setProducts((current) => current.filter((p) => p.id !== id));
    },
    [setProducts],
  );

  return { products, isSaved, toggle, remove, ready };
}

export function useSavedLooks() {
  const [looks, setLooks] = useState<Look[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLooks(getLooks());
    setReady(true);
    return subscribeLooks(() => setLooks(getLooks()));
  }, []);

  const save = useCallback((look: Look) => {
    saveLook(look);
  }, []);

  const remove = useCallback((id: string) => {
    deleteLook(id);
  }, []);

  const rename = useCallback((id: string, title: string) => {
    const look = getLook(id);
    const clean = title.trim();
    if (!look || !clean) return;
    saveLook({ ...look, title: clean });
  }, []);

  return { looks, save, remove, rename, ready };
}

export interface StyleProfileSize {
  top: string;
  bottom: string;
  shoes: string;
}

export interface StyleProfile {
  aesthetics: string[];
  sizes: StyleProfileSize;
  budget: { min: number; max: number };
}

export interface StyleProfilePatch {
  aesthetics?: string[];
  sizes?: Partial<StyleProfileSize>;
  budget?: Partial<StyleProfile["budget"]>;
}

export const DEFAULT_STYLE_PROFILE: StyleProfile = {
  aesthetics: [],
  sizes: { top: "", bottom: "", shoes: "" },
  budget: { min: 0, max: 5000 },
};

function parseStyleProfile(raw: unknown): StyleProfile | null {
  if (!isRecord(raw)) return null;
  const sizes = isRecord(raw.sizes) ? raw.sizes : {};
  const budget = isRecord(raw.budget) ? raw.budget : {};
  const text = (value: unknown) => (typeof value === "string" ? value : "");
  const num = (value: unknown, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return {
    aesthetics: Array.isArray(raw.aesthetics)
      ? raw.aesthetics.filter((value): value is string => typeof value === "string")
      : [],
    sizes: { top: text(sizes.top), bottom: text(sizes.bottom), shoes: text(sizes.shoes) },
    budget: {
      min: num(budget.min, DEFAULT_STYLE_PROFILE.budget.min),
      max: num(budget.max, DEFAULT_STYLE_PROFILE.budget.max),
    },
  };
}

export function useStyleProfile() {
  const [profile, setProfile, ready] = usePersisted<StyleProfile>(
    PROFILE_KEY,
    DEFAULT_STYLE_PROFILE,
    parseStyleProfile,
  );

  const update = useCallback(
    (patch: StyleProfilePatch) => {
      setProfile((current) => ({
        aesthetics: patch.aesthetics ?? current.aesthetics,
        sizes: { ...current.sizes, ...patch.sizes },
        budget: { ...current.budget, ...patch.budget },
      }));
    },
    [setProfile],
  );

  return { profile, update, ready };
}

function parseStringArray(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
}

const EMPTY_QUERIES: string[] = [];

export function useRecentSearches() {
  const [queries, setQueries, ready] = usePersisted<string[]>(
    SEARCHES_KEY,
    EMPTY_QUERIES,
    parseStringArray,
  );

  const add = useCallback(
    (query: string) => {
      const clean = query.trim();
      if (!clean) return;
      setQueries((current) =>
        [clean, ...current.filter((q) => q.toLowerCase() !== clean.toLowerCase())].slice(
          0,
          MAX_RECENT_SEARCHES,
        ),
      );
    },
    [setQueries],
  );

  const clear = useCallback(() => {
    setQueries([]);
  }, [setQueries]);

  return { queries, add, clear, ready };
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function useTheme() {
  const [theme, setThemeState] = useState<ThemePref>("dark");
  const [resolved, setResolved] = useState<ResolvedTheme>("dark");
  const [ready, setReady] = useState(false);

  useIsoLayoutEffect(() => {
    const sync = (pref: ThemePref) => {
      const next = resolveTheme(pref);
      applyTheme(next);
      setThemeState(pref);
      setResolved(next);
    };
    sync(readThemePref());
    setReady(true);

    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onMedia = () => {
      if (readThemePref() === "system") sync("system");
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_KEY) sync(readThemePref());
    };
    media.addEventListener("change", onMedia);
    window.addEventListener("storage", onStorage);
    return () => {
      media.removeEventListener("change", onMedia);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const setTheme = useCallback((pref: ThemePref) => {
    writeThemePref(pref);
    const next = resolveTheme(pref);
    applyTheme(next);
    setThemeState(pref);
    setResolved(next);
  }, []);

  const toggle = useCallback(() => {
    setTheme(resolved === "dark" ? "light" : "dark");
  }, [resolved, setTheme]);

  return { theme, resolved, setTheme, toggle, ready };
}
