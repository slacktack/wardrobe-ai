import type { ExtractedItem, Gender, Product } from "@/lib/types";
import { Check } from "lucide-react";
import { ItemCard } from "@/components/studio/ItemCard";
import type { MatchState } from "@/components/studio/useMatches";
import { cn, formatINR } from "@/lib/utils";

const GENDERS: { value: Gender; label: string }[] = [
  { value: "men", label: "Menswear" },
  { value: "women", label: "Womenswear" },
];

export function LookSummary({
  items,
  vibe,
  image,
  gender,
  onGender,
  picks,
  chosen,
  matches,
  saved,
  onOpen,
}: {
  items: ExtractedItem[];
  vibe?: string;
  image: string | null;
  gender: Gender;
  onGender: (gender: Gender) => void;
  picks: Record<string, Product | null>;
  chosen: Record<string, boolean>;
  matches: Record<string, MatchState>;
  saved: boolean;
  onOpen: (item: ExtractedItem) => void;
}) {
  const withPin = items.filter((item) => item.box);
  const total = items.reduce((sum, item) => sum + (picks[item.id]?.price ?? 0), 0);

  return (
    <section className="px-5 pb-44 pt-6">
      {image ? (
        <div className="relative overflow-hidden rounded-card border border-line bg-surface-2">
          <img src={image} alt="Your outfit" className="block h-auto max-h-[50dvh] w-full object-cover" />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-ink/80 to-transparent" />
          {withPin.map((item) => {
            const [x, y, w, h] = item.box!;
            const done = Boolean(picks[item.id]);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpen(item)}
                aria-label={`Open ${item.name}`}
                className="absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                style={{ left: `${(x + w / 2) * 100}%`, top: `${(y + h / 2) * 100}%` }}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-lg",
                    done ? "bg-acid text-acid-ink" : "animate-pulse bg-white/30 backdrop-blur",
                  )}
                >
                  {done ? <Check aria-hidden className="h-3.5 w-3.5" /> : null}
                </span>
              </button>
            );
          })}
          {vibe ? (
            <p className="absolute bottom-3 left-4 right-4 font-serif text-2xl italic leading-tight text-white">
              {vibe}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Shop for" className="flex rounded-pill border border-line p-1">
          {GENDERS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={gender === option.value}
              onClick={() => onGender(option.value)}
              className={cn(
                "min-h-9 rounded-pill px-3.5 text-xs font-medium transition-colors",
                gender === option.value ? "bg-acid text-acid-ink" : "text-muted hover:text-cream",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="text-right text-xs text-muted">
          {total > 0 ? (
            <>
              Whole fit <span className="text-sm font-medium text-cream">{formatINR(total)}</span>
            </>
          ) : null}
        </p>
      </div>

      <h1 className="mt-7 font-serif text-4xl leading-none text-cream">Pieces in this fit</h1>
      <p className="mt-2 text-sm text-muted">
        We picked the best match for each. Tap one to compare or swap.
      </p>

      <ul className="mt-5 flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.id}>
            <ItemCard
              item={item}
              product={picks[item.id] ?? null}
              match={matches[item.id] ?? { status: "loading" }}
              chosen={Boolean(chosen[item.id])}
              onOpen={onOpen}
            />
          </li>
        ))}
      </ul>

      {saved ? <p className="mt-8 text-center text-sm text-acid">Saved to your lookbook.</p> : null}
    </section>
  );
}
