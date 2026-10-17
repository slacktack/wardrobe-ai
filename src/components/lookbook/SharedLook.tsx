"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { decodeLook } from "@/lib/share";
import type { Look, LookPick, Product } from "@/lib/types";
import { cn, discountPct, formatINR } from "@/lib/utils";
import { formatSpreadDate } from "@/components/lookbook/format";
import { PickThumb } from "@/components/lookbook/PickThumb";

const SHELL_PAD = "pb-[calc(7rem_+_env(safe-area-inset-bottom,0px))]";

const CTA =
  "inline-flex min-h-11 items-center gap-2 rounded-pill bg-acid px-6 text-sm font-medium text-ink transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid";

export default function SharedLook({ encoded }: { encoded: string }) {
  const look = useMemo(() => decodeLook(encoded), [encoded]);
  if (!look) return <BrokenLink />;
  return <Spread look={look} />;
}

function BrokenLink() {
  return (
    <main className={cn("flex min-h-dvh flex-col justify-center", SHELL_PAD)}>
      <div className="mx-auto w-full max-w-3xl px-5">
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted">
          Wardrobe AI
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">
          This link is broken or expired
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
          The look may have been deleted, or the link was cut short in transit.
          Ask for a fresh link, or start a look of your own.
        </p>
        <Link href="/" className={cn(CTA, "mt-8")}>
          Build your own look <ArrowUpRight size={15} aria-hidden />
        </Link>
      </div>
    </main>
  );
}

function HeroGrid({ images }: { images: string[] }) {
  if (images.length === 0) {
    return (
      <div className="mt-8 grid min-h-48 place-items-center rounded-card border border-line bg-surface">
        <span className="px-6 text-center font-serif text-lg italic text-muted/70">
          No pieces were found for this look
        </span>
      </div>
    );
  }
  return (
    <div className="mt-8 grid grid-cols-2 gap-2 sm:gap-3">
      {images.map((image, i) => (
        <img
          key={`${image}-${i}`}
          src={image}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className={cn(
            "aspect-[3/4] w-full rounded-card border border-line bg-surface-2 object-cover",
            images.length % 2 === 1 && i === 0 && "col-span-2 aspect-[4/3]",
          )}
        />
      ))}
    </div>
  );
}

function PieceRow({ pick, index }: { pick: LookPick; index: number }) {
  const product = pick.product;
  const off = product ? discountPct(product.price, product.mrp) : null;
  return (
    <li className="flex items-start gap-3 py-4">
      <span className="w-7 shrink-0 pt-0.5 font-serif text-sm text-acid">
        {String(index + 1).padStart(2, "0")}
      </span>
      <PickThumb image={product?.image} className="w-16" />
      <div className="min-w-0 flex-1">
        <p className="font-serif text-lg italic leading-snug">
          {pick.item.name}
        </p>
        <p className="mt-0.5 text-[10px] uppercase tracking-[0.22em] text-muted">
          {pick.item.category}
        </p>
        {product ? (
          <>
            <p className="mt-1.5 truncate text-sm text-muted">
              {product.title}
            </p>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-sm">
              <span>{formatINR(product.price)}</span>
              {product.mrp && product.mrp > product.price ? (
                <span className="text-xs text-muted line-through">
                  {formatINR(product.mrp)}
                </span>
              ) : null}
              {off !== null ? (
                <span className="text-xs text-acid">{off}% off</span>
              ) : null}
              <span className="text-xs text-muted">· {product.store}</span>
            </p>
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Shop ${product.title} on ${product.store}`}
              className="mt-1 inline-flex min-h-11 items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-acid transition-opacity hover:opacity-80"
            >
              Shop <ArrowUpRight size={13} aria-hidden />
            </a>
          </>
        ) : (
          <p className="mt-2 font-serif text-sm italic text-muted/70">
            Not found
          </p>
        )}
      </div>
    </li>
  );
}

function Spread({ look }: { look: Look }) {
  const picked = look.picks.filter(
    (pick): pick is LookPick & { product: Product } => pick.product !== null,
  );
  const images = picked.map((pick) => pick.product.image);
  const total = picked.reduce((sum, pick) => sum + pick.product.price, 0);

  return (
    <main className={cn("min-h-dvh", SHELL_PAD)}>
      <div className="mx-auto w-full max-w-3xl px-5 pt-10">
        <header>
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted">
            Wardrobe AI — Shared look
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-[1.02] sm:text-6xl">
            {look.title}
          </h1>
          {look.vibe ? (
            <blockquote className="mt-5 max-w-xl border-l-2 border-acid pl-4 font-serif text-xl italic leading-snug text-cream/85 sm:text-2xl">
              {look.vibe}
            </blockquote>
          ) : null}
          <p className="mt-4 text-[10px] uppercase tracking-[0.24em] text-muted">
            {formatSpreadDate(look.createdAt)} · {picked.length} of{" "}
            {look.picks.length} pieces found
          </p>
        </header>

        <HeroGrid images={images} />

        <section className="mt-12">
          <h2 className="text-[11px] uppercase tracking-[0.3em] text-muted">
            The pieces
          </h2>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {look.picks.map((pick, i) => (
              <PieceRow key={`${pick.item.id}-${i}`} pick={pick} index={i} />
            ))}
          </ul>
          <div className="mt-4 flex items-baseline justify-between gap-3">
            <p className="text-xs text-muted">
              {look.picks.length}{" "}
              {look.picks.length === 1 ? "piece" : "pieces"} in this look
            </p>
            {total > 0 ? (
              <p className="font-serif text-xl">Total {formatINR(total)}</p>
            ) : null}
          </div>
        </section>

        <footer className="mt-14 border-t border-line pt-8">
          <Link href="/" className={CTA}>
            Build your own look <ArrowUpRight size={15} aria-hidden />
          </Link>
          <p className="mt-4 text-xs text-muted">
            Shoot an outfit, find the pieces, save the look. Wardrobe AI.
          </p>
        </footer>
      </div>
    </main>
  );
}
