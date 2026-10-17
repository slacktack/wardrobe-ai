import { useEffect, useState } from "react";
import { ArrowUpRight, Check, ChevronDown, Copy, Trash2 } from "lucide-react";
import { deleteLook } from "@/lib/storage";
import { isShareable, lookShareUrl, shareLength } from "@/lib/share";
import type { Look, LookPick, Product } from "@/lib/types";
import { cn, formatINR } from "@/lib/utils";
import { formatCardDate } from "@/components/lookbook/format";
import { PickThumb } from "@/components/lookbook/PickThumb";

type ShareState = "idle" | "copied" | "toolong" | "error";

const PILL =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-pill px-4 text-xs font-medium tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid";

type CollageSlot = { pos: string; size: string };

const SLOTS_ONE: CollageSlot[] = [
  { pos: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-2", size: "w-32" },
];

const SLOTS_TWO: CollageSlot[] = [
  { pos: "left-[16%] top-1/2 -translate-y-1/2 -rotate-6", size: "w-28" },
  { pos: "right-[16%] top-1/2 -translate-y-1/2 rotate-3", size: "w-28" },
];

const SLOTS_THREE: CollageSlot[] = [
  { pos: "left-[6%] top-1/2 -translate-y-1/2 -rotate-6", size: "w-24" },
  { pos: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20", size: "w-28" },
  { pos: "right-[6%] top-1/2 -translate-y-1/2 rotate-6", size: "w-24" },
];

function collageSlots(count: number): CollageSlot[] {
  if (count >= 3) return SLOTS_THREE;
  if (count === 2) return SLOTS_TWO;
  return SLOTS_ONE;
}

function Collage({ images }: { images: string[] }) {
  if (images.length === 0) {
    return (
      <div className="grid h-full min-h-44 place-items-center bg-surface-2">
        <span className="px-6 text-center font-serif text-base italic text-muted/70">
          No pieces found
        </span>
      </div>
    );
  }
  const shown = images.slice(0, 3);
  const slots = collageSlots(shown.length);
  return (
    <>
      {shown.map((image, i) => (
        <img
          key={`${image}-${i}`}
          src={image}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className={cn(
            "absolute aspect-[3/4] rounded-xl border border-line bg-surface-2 object-cover shadow-lg shadow-ink/40",
            slots[i].pos,
            slots[i].size,
          )}
        />
      ))}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-ink/60 to-transparent" />
    </>
  );
}

function shareStatusText(state: ShareState, length: number): string {
  switch (state) {
    case "copied":
      return "Link copied to clipboard";
    case "error":
      return "Could not copy - the browser blocked clipboard access";
    case "toolong":
      return `Too big for a share link (${length} characters). Remove a few pieces and save again.`;
    default:
      return "";
  }
}

export function LookCard({ look, index }: { look: Look; index: number }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [shareState, setShareState] = useState<ShareState>("idle");

  useEffect(() => {
    if (shareState !== "copied" && shareState !== "error") return;
    const timer = setTimeout(() => setShareState("idle"), 2400);
    return () => clearTimeout(timer);
  }, [shareState]);

  const picked = look.picks.filter(
    (pick): pick is LookPick & { product: Product } => pick.product !== null,
  );
  const images = picked.map((pick) => pick.product.image);
  const total = picked.reduce((sum, pick) => sum + pick.product.price, 0);
  const status = shareStatusText(shareState, shareLength(look));

  async function handleShare() {
    if (!isShareable(look)) {
      setShareState("toolong");
      return;
    }
    try {
      const url = lookShareUrl(look, window.location.origin);
      await navigator.clipboard.writeText(url);
      setShareState("copied");
    } catch {
      setShareState("error");
    }
  }

  return (
    <article className="overflow-hidden rounded-card border border-line bg-surface transition-colors hover:border-cream/15">
      <div className="relative h-44 overflow-hidden bg-surface-2">
        <Collage images={images} />
        <span className="absolute left-4 top-3 z-30 font-serif text-sm text-acid">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="absolute right-4 top-3 z-30 text-[10px] uppercase tracking-[0.22em] text-cream/70">
          {formatCardDate(look.createdAt)}
        </span>
      </div>

      <div className="p-5">
        <h2 className="font-serif text-2xl leading-tight">{look.title}</h2>
        {look.vibe ? (
          <p className="mt-1 truncate font-serif text-base italic text-muted">
            {look.vibe}
          </p>
        ) : null}

        <div className="mt-3 flex items-baseline justify-between gap-3">
          <p className="text-xs text-muted">
            {look.picks.length} {look.picks.length === 1 ? "piece" : "pieces"} ·{" "}
            {picked.length} found
          </p>
          <p className="font-serif text-lg">
            {total > 0 ? formatINR(total) : "--"}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_1fr_auto] items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void handleShare();
            }}
            className={cn(
              PILL,
              "border border-line bg-surface-2",
              shareState === "copied"
                ? "border-acid/40 text-acid"
                : "text-cream hover:border-cream/30",
            )}
          >
            {shareState === "copied" ? (
              <Check size={15} aria-hidden />
            ) : (
              <Copy size={15} aria-hidden />
            )}
            {shareState === "copied" ? "Copied" : "Share"}
          </button>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className={cn(PILL, "border border-line text-cream hover:border-cream/30")}
          >
            Details
            <ChevronDown
              size={15}
              aria-hidden
              className={cn(
                "transition-transform duration-200",
                open && "rotate-180",
              )}
            />
          </button>
          <button
            type="button"
            aria-label={`Delete ${look.title}`}
            onClick={() => setConfirming(true)}
            className="inline-flex size-11 items-center justify-center rounded-pill border border-line text-muted transition-colors hover:text-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid"
          >
            <Trash2 size={16} aria-hidden />
          </button>
        </div>

        <p
          role="status"
          aria-live="polite"
          className={cn(
            "text-xs",
            status ? "mt-3" : "sr-only",
            shareState === "copied" ? "text-acid" : "text-muted",
          )}
        >
          {status}
        </p>

        {confirming ? (
          <div className="mt-3 rounded-card border border-line bg-surface-2 p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
              Delete this look?
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => deleteLook(look.id)}
                className={cn(PILL, "bg-cream text-ink hover:bg-cream/90")}
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className={cn(PILL, "border border-line text-cream hover:border-cream/30")}
              >
                Keep
              </button>
            </div>
          </div>
        ) : null}

        {open ? (
          <ul className="mt-4 divide-y divide-line border-t border-line">
            {look.picks.map((pick, i) => (
              <li key={`${pick.item.id}-${i}`} className="flex gap-3 py-3.5">
                <PickThumb image={pick.product?.image} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif text-base italic leading-snug">
                    {pick.item.name}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.22em] text-muted">
                    {pick.item.category}
                  </p>
                  {pick.product ? (
                    <>
                      <p className="mt-1.5 truncate text-xs text-muted">
                        {pick.product.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        <span className="text-cream">
                          {formatINR(pick.product.price)}
                        </span>{" "}
                        · {pick.product.store}
                      </p>
                      <a
                        href={pick.product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View ${pick.product.title} on ${pick.product.store}`}
                        className="mt-1 inline-flex min-h-11 items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-acid transition-opacity hover:opacity-80"
                      >
                        View <ArrowUpRight size={13} aria-hidden />
                      </a>
                    </>
                  ) : (
                    <p className="mt-1.5 font-serif text-sm italic text-muted/70">
                      Not found
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
