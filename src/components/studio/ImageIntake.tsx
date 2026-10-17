"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ClipboardPaste, ImagePlus, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";

const EXAMPLES = [
  {
    url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&q=80&auto=format&fit=crop",
    label: "Editorial",
  },
  {
    url: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900&q=80&auto=format&fit=crop",
    label: "Street style",
  },
];

interface ImageIntakeProps {
  onFile: (file: File) => void;
  onExample: (url: string) => void;
  errorMessage?: string | null;
}

export function ImageIntake({ onFile, onExample, errorMessage }: ImageIntakeProps) {
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

        <div className="mt-12">
          <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.26em] text-muted">
            <LayoutTemplate aria-hidden className="h-3.5 w-3.5" />
            Try an example
          </p>
          <div className="snap-row mt-4 gap-3">
            {EXAMPLES.map((example) => (
              <button
                key={example.url}
                type="button"
                onClick={() => onExample(example.url)}
                className="group w-[8.5rem] text-left"
              >
                <span className="block aspect-[3/4] overflow-hidden rounded-card border border-line bg-surface-2">
                  <img
                    src={example.url}
                    alt={`${example.label} outfit example`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-300 group-active:scale-[0.98]"
                  />
                </span>
                <span className="mt-2 block font-serif text-base italic text-muted transition-colors group-hover:text-cream">
                  {example.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
