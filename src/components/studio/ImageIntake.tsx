"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ClipboardPaste, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";

interface ImageIntakeProps {
  onFile: (file: File) => void;
  errorMessage?: string | null;
}

export function ImageIntake({ onFile, errorMessage }: ImageIntakeProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const entry = items[i];
        if (entry.type.startsWith("image/")) {
          const file = entry.getAsFile();
          if (file) {
            event.preventDefault();
            onFile(file);
            return;
          }
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [onFile]);

  return (
    <div className="pb-safe">
      <section
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = Array.from(event.dataTransfer.files).find((candidate) =>
            candidate.type.startsWith("image/"),
          );
          if (file) onFile(file);
        }}
        className="relative flex flex-1 flex-col px-5 pb-28 pt-12"
      >
        {dragging ? (
          <div className="pointer-events-none absolute inset-3 z-10 flex items-center justify-center rounded-card border border-dashed border-acid/60 bg-acid/5">
            <p className="font-serif text-2xl italic text-acid">Drop it here.</p>
          </div>
        ) : null}

        <p className="text-[10px] uppercase tracking-[0.3em] text-muted">AI stylist</p>
        <h1 className="mt-5 font-serif text-[3.25rem] leading-[0.95] text-cream">
          Get the <em className="italic text-acid">look</em>.
        </h1>
        <p className="mt-5 max-w-[30ch] text-sm leading-relaxed text-muted">
          Drop a fit photo. We pull it apart piece by piece, then hunt the closest match on the
          racks.
        </p>

        <div className="mt-9">
          <Button size="lg" className="w-full" onClick={() => inputRef.current?.click()}>
            <Camera aria-hidden className="h-5 w-5" />
            Upload a fit
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onFile(file);
              event.target.value = "";
            }}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Chip>
            <ClipboardPaste aria-hidden className="h-3.5 w-3.5" />
            Or paste a screenshot
          </Chip>
          <Chip>
            <ImagePlus aria-hidden className="h-3.5 w-3.5" />
            Drop an image anywhere
          </Chip>
        </div>

        {errorMessage ? (
          <p className="mt-6 rounded-card border border-line bg-surface px-4 py-3 text-xs leading-relaxed text-cream/90">
            {errorMessage}
          </p>
        ) : null}
      </section>
    </div>
  );
}
