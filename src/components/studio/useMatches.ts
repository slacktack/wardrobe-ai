"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ExtractedItem, Gender, Product } from "@/lib/types";
import { parseSearch, postJson } from "@/components/studio/api";

export type MatchState =
  | { status: "loading" }
  | { status: "ready"; products: Product[] }
  | { status: "error"; message: string };

const LOADING: MatchState = { status: "loading" };

async function fetchMatches(item: ExtractedItem, gender: Gender): Promise<MatchState> {
  try {
    const data = await postJson("/api/search", {
      query: item.searchQuery,
      category: item.category,
      gender,
      limit: 20,
    });
    const result = parseSearch(data);
    return result.ok
      ? { status: "ready", products: result.products }
      : { status: "error", message: result.error };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Search failed. Try again." };
  }
}

// Prefetches matches for every piece so the best one is already picked when the list appears.
export function useMatches(items: ExtractedItem[], gender: Gender) {
  const runKey = `${gender}|${items.map((item) => `${item.id}:${item.searchQuery}`).join("|")}`;
  const [store, setStore] = useState<{ key: string; byId: Record<string, MatchState> }>({
    key: "",
    byId: {},
  });
  const keyRef = useRef(runKey);
  useEffect(() => {
    keyRef.current = runKey;
  }, [runKey]);

  useEffect(() => {
    if (items.length === 0) return;
    for (const item of items) {
      void fetchMatches(item, gender).then((state) => {
        if (keyRef.current !== runKey) return;
        setStore((current) => ({
          key: runKey,
          byId: { ...(current.key === runKey ? current.byId : {}), [item.id]: state },
        }));
      });
    }
  }, [runKey, items, gender]);

  const retry = useCallback(
    (item: ExtractedItem) => {
      const key = keyRef.current;
      setStore((current) => ({
        key,
        byId: { ...(current.key === key ? current.byId : {}), [item.id]: LOADING },
      }));
      void fetchMatches(item, gender).then((state) => {
        if (keyRef.current !== key) return;
        setStore((current) => ({
          key,
          byId: { ...(current.key === key ? current.byId : {}), [item.id]: state },
        }));
      });
    },
    [gender],
  );

  const matchFor = (id: string): MatchState => (store.key === runKey ? store.byId[id] ?? LOADING : LOADING);
  return { matchFor, retry };
}
