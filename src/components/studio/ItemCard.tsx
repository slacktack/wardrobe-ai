import type { ExtractedItem, Product } from "@/lib/types";
import { Check, ChevronRight, Sparkles } from "lucide-react";
import { colorHex } from "@/components/studio/colors";
import type { MatchState } from "@/components/studio/useMatches";
import { discountPct, formatINR } from "@/lib/utils";

function Swatches({ colors }: { colors: string[] }) {
  return (
    <span className="flex items-center gap-1">
      {colors.slice(0, 4).map((color, index) => {
        const hex = colorHex(color);
        return (
          <span
            key={`${color}-${index}`}
            title={color}
            aria-hidden
            className="h-3 w-3 rounded-full border border-white/15"
            style={{ backgroundColor: hex ?? "rgba(255,255,255,0.1)" }}
          />
        );
      })}
    </span>
  );
}

export function ItemCard({
  item,
  product,
  match,
  chosen,
  onOpen,
}: {
  item: ExtractedItem;
  product: Product | null;
  match: MatchState;
  chosen: boolean;
  onOpen: (item: ExtractedItem) => void;
}) {
  const off = product ? discountPct(product.price, product.mrp) : null;
  const loading = match.status === "loading";

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="group flex w-full items-stretch gap-4 rounded-card border border-line bg-surface p-3 text-left transition-[border-color,transform] hover:border-white/20 active:scale-[0.99]"
    >
      <span className="relative block w-24 shrink-0 overflow-hidden rounded-xl bg-surface-2">
        <span className="block aspect-[3/4] w-full">
          {product ? (
            <img
              src={product.image}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          ) : (
            <span
              className={`flex h-full w-full items-center justify-center text-muted ${loading ? "animate-pulse bg-white/[0.04]" : ""}`}
            >
              {loading ? null : <span className="text-[11px]">No match</span>}
            </span>
          )}
        </span>
        {product ? (
          <span className="absolute bottom-1.5 left-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-acid text-acid-ink">
            {chosen ? <Check aria-hidden className="h-3.5 w-3.5" /> : <Sparkles aria-hidden className="h-3.5 w-3.5" />}
          </span>
        ) : null}
      </span>

      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 py-1">
        <span className="flex items-center gap-2 text-[11px] capitalize text-muted">
          {item.category}
          {item.colors.length > 0 ? <Swatches colors={item.colors} /> : null}
        </span>
        <span className="font-serif text-xl leading-tight text-cream">{item.name}</span>
        {product ? (
          <span className="min-w-0 space-y-0.5">
            <span className="block truncate text-xs text-muted">
              {chosen ? "Your pick" : "Top match"} · {product.store}
            </span>
            <span className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-cream">{formatINR(product.price)}</span>
              {off ? <span className="text-[11px] text-acid">{off}% off</span> : null}
            </span>
          </span>
        ) : loading ? (
          <span className="text-xs text-muted">Finding the best match...</span>
        ) : (
          <span className="text-xs text-muted">Tap to search again</span>
        )}
      </span>

      <span className="flex items-center pr-0.5 text-muted transition-transform group-hover:translate-x-0.5">
        <ChevronRight aria-hidden className="h-4 w-4" />
      </span>
    </button>
  );
}
