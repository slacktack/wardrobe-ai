"use client";

import { useCallback, useRef, useState } from "react";
import type { ExtractedItem, Gender, Look, Product } from "@/lib/types";
import { newId, saveLook } from "@/lib/storage";
import { downscaleToDataUrl } from "@/lib/image";
import { ImageOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Toast, type ToastData } from "@/components/ui/Toast";
import { ImageIntake } from "@/components/studio/ImageIntake";
import { ExtractingView } from "@/components/studio/ExtractingView";
import { LookSummary } from "@/components/studio/LookSummary";
import { StickyActionBar } from "@/components/studio/StickyActionBar";
import { ItemSheet } from "@/components/studio/ItemSheet";
import { parseExtract, postJson } from "@/components/studio/api";
import { useMatches } from "@/components/studio/useMatches";

type Phase = "idle" | "extracting" | "items" | "error";

export function StudioScreen() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [image, setImage] = useState<string | null>(null);
  const [items, setItems] = useState<ExtractedItem[]>([]);
  const [vibe, setVibe] = useState<string | undefined>(undefined);
  const [gender, setGender] = useState<Gender>("men");
  const [userPicks, setUserPicks] = useState<Record<string, Product>>({});
  const [error, setError] = useState<string | null>(null);
  const [sheetItem, setSheetItem] = useState<ExtractedItem | null>(null);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const requestRef = useRef(0);
  const { matchFor, retry } = useMatches(items, gender);

  const runExtract = useCallback(async (source: string) => {
    const requestId = ++requestRef.current;
    setError(null);
    setImage(source);
    setPhase("extracting");
    try {
      const data = await postJson("/api/extract", { image: source });
      if (requestRef.current !== requestId) return;
      const result = parseExtract(data);
      if (!result.ok) {
        setError(result.error);
        setPhase("error");
        return;
      }
      if (result.items.length === 0) {
        setError("We could not spot any pieces in that one. Try a clearer photo.");
        setPhase("error");
        return;
      }
      setItems(result.items);
      setVibe(result.vibe);
      setGender(result.gender ?? "men");
      setUserPicks({});
      setSaved(false);
      setPhase("items");
    } catch (err) {
      if (requestRef.current !== requestId) return;
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setPhase("error");
    }
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      try {
        const dataUrl = await downscaleToDataUrl(file);
        await runExtract(dataUrl);
      } catch (err) {
        setImage(null);
        setPhase("idle");
        setError(err instanceof Error ? err.message : "Could not read that file.");
      }
    },
    [runExtract],
  );

  const handleStartOver = useCallback(() => {
    requestRef.current += 1;
    setPhase("idle");
    setImage(null);
    setItems([]);
    setVibe(undefined);
    setUserPicks({});
    setError(null);
    setSheetItem(null);
    setSaved(false);
    setToast(null);
  }, []);

  const handleSelect = useCallback((item: ExtractedItem, product: Product) => {
    setUserPicks((current) => ({ ...current, [item.id]: product }));
    setSheetItem(null);
    setSaved(false);
  }, []);

  const closeSheet = useCallback(() => setSheetItem(null), []);
  const closeToast = useCallback(() => setToast(null), []);

  const handleGender = useCallback((next: Gender) => {
    setGender(next);
    setUserPicks({});
    setSaved(false);
  }, []);

  const matches = Object.fromEntries(items.map((item) => [item.id, matchFor(item.id)]));
  const picks = Object.fromEntries(
    items.map((item) => {
      const match = matches[item.id];
      const best = match.status === "ready" ? (match.products[0] ?? null) : null;
      return [item.id, userPicks[item.id] ?? best];
    }),
  ) as Record<string, Product | null>;
  const chosen = Object.fromEntries(items.map((item) => [item.id, Boolean(userPicks[item.id])]));
  const found = items.filter((item) => picks[item.id]).length;
  const price = items.reduce((sum, item) => sum + (picks[item.id]?.price ?? 0), 0);

  const handleSave = useCallback(() => {
    const createdAt = Date.now();
    const look: Look = {
      version: 1,
      id: newId(),
      createdAt,
      title: `Look ${new Date(createdAt).toLocaleDateString("en-IN")}`,
      vibe,
      picks: items.map((item) => ({ item, product: picks[item.id] })),
    };
    saveLook(look);
    setSaved(true);
    setToast({ message: "Look saved to your lookbook.", href: "/lookbook", actionLabel: "Open" });
  }, [items, picks, vibe]);

  return (
    <>
      {phase === "idle" ? (
        <ImageIntake onFile={handleFile} onExample={runExtract} errorMessage={error} />
      ) : null}

      {phase === "extracting" ? <ExtractingView image={image} /> : null}

      {phase === "error" ? (
        <div className="pb-safe">
          <section className="flex flex-1 flex-col px-5 pb-28 pt-16">
            <EmptyState
              icon={ImageOff}
              title="No read on that one."
              description={error ?? "Something went wrong. Try again."}
            />
            <div className="mt-8 flex flex-col gap-3">
              {image ? (
                <Button onClick={() => void runExtract(image)}>Try that photo again</Button>
              ) : null}
              <Button variant="outline" onClick={handleStartOver}>
                Start over
              </Button>
            </div>
          </section>
        </div>
      ) : null}

      {phase === "items" ? (
        <>
          <div className="pb-safe">
            <LookSummary
              items={items}
              vibe={vibe}
              image={image}
              gender={gender}
              onGender={handleGender}
              picks={picks}
              chosen={chosen}
              matches={matches}
              saved={saved}
              onOpen={setSheetItem}
            />
          </div>
          <StickyActionBar
            found={found}
            total={items.length}
            price={price}
            saved={saved}
            onSave={handleSave}
            onStartOver={handleStartOver}
          />
        </>
      ) : null}

      <ItemSheet
        item={sheetItem}
        match={sheetItem ? matches[sheetItem.id] ?? { status: "loading" } : { status: "loading" }}
        selected={sheetItem ? (picks[sheetItem.id] ?? null) : null}
        onClose={closeSheet}
        onSelect={handleSelect}
        onRetry={retry}
      />
      <Toast toast={toast} onClose={closeToast} />
    </>
  );
}
