"use client";

import { useState } from "react";
import { Check, Palette, Ruler, Trash2, Wallet } from "lucide-react";
import { cn, formatINR } from "@/lib/utils";
import { useSavedLooks, useSavedProducts, useStyleProfile, useTheme } from "@/lib/store";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import type { ThemePref } from "@/lib/theme";

const AESTHETICS = [
  "minimal",
  "streetwear",
  "vintage",
  "y2k",
  "gorpcore",
  "preppy",
  "old money",
  "grunge",
  "athleisure",
  "boho",
];

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Palette;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4">
      <header className="flex items-center gap-2">
        <Icon aria-hidden className="h-4 w-4 text-acid" strokeWidth={1.8} />
        <h2 className="text-[10px] uppercase tracking-[0.24em] text-muted">{title}</h2>
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex w-full min-w-0 flex-1 flex-col gap-1.5">
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full min-w-0 rounded-xl border border-line bg-surface-2 px-3 text-sm text-cream outline-none placeholder:text-muted focus:border-acid/60"
      />
    </label>
  );
}

export function ProfileScreen() {
  const { theme, setTheme } = useTheme();
  const { profile, update } = useStyleProfile();
  const { products, remove: removeProduct, ready: productsReady } = useSavedProducts();
  const { looks, remove: removeLook, ready: looksReady } = useSavedLooks();
  const [cleared, setCleared] = useState<string | null>(null);

  const toggleAesthetic = (value: string) => {
    const next = profile.aesthetics.includes(value)
      ? profile.aesthetics.filter((entry) => entry !== value)
      : [...profile.aesthetics, value];
    update({ aesthetics: next });
  };

  const flash = (message: string) => {
    setCleared(message);
    window.setTimeout(() => setCleared(null), 2200);
  };

  return (
    <div className="flex flex-col gap-4 px-5 pb-32 pt-6">
      <header className="flex flex-col gap-1 pb-1">
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted">Tuned to you</p>
        <h1 className="font-serif text-4xl leading-none text-cream">Profile</h1>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-card border border-line bg-surface p-4">
          <p className="font-serif text-3xl text-cream">{productsReady ? products.length : "—"}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted">Pieces saved</p>
        </div>
        <div className="rounded-card border border-line bg-surface p-4">
          <p className="font-serif text-3xl text-cream">{looksReady ? looks.length : "—"}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted">Looks built</p>
        </div>
      </div>

      <Section icon={Palette} title="Appearance">
        <SegmentedControl<ThemePref>
          label="Theme"
          value={theme}
          onChange={setTheme}
          options={[
            { value: "system", label: "System" },
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
        />
      </Section>

      <Section icon={Ruler} title="Your fit">
        <div className="flex w-full min-w-0 gap-2.5">
          <Field
            label="Top"
            value={profile.sizes.top}
            onChange={(value) => update({ sizes: { top: value } })}
            placeholder="M"
          />
          <Field
            label="Bottom"
            value={profile.sizes.bottom}
            onChange={(value) => update({ sizes: { bottom: value } })}
            placeholder="32"
          />
          <Field
            label="Shoes"
            value={profile.sizes.shoes}
            onChange={(value) => update({ sizes: { shoes: value } })}
            placeholder="UK 9"
          />
        </div>
      </Section>

      <Section icon={Wallet} title="Budget">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>{formatINR(profile.budget.min)}</span>
          <span>{formatINR(profile.budget.max)}</span>
        </div>
        <input
          type="range"
          min={500}
          max={20000}
          step={500}
          value={profile.budget.max}
          aria-label="Maximum budget"
          onChange={(event) => update({ budget: { max: Number(event.target.value) } })}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-pill bg-surface-2 accent-acid"
        />
      </Section>

      <Section icon={Check} title="Aesthetics">
        <div className="flex flex-wrap gap-2">
          {AESTHETICS.map((value) => {
            const on = profile.aesthetics.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleAesthetic(value)}
                aria-pressed={on}
                className={cn(
                  "rounded-pill border px-3.5 py-2 text-[11px] uppercase tracking-[0.16em] transition-colors",
                  on ? "border-acid/60 bg-acid/10 text-acid" : "border-line text-muted hover:text-cream",
                )}
              >
                {value}
              </button>
            );
          })}
        </div>
      </Section>

      <Section icon={Trash2} title="Your data">
        <p className="text-xs leading-relaxed text-muted">
          Everything lives on this device only. Nothing is uploaded to an account.
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              for (const product of products) removeProduct(product.id);
              flash("Saved pieces cleared.");
            }}
            className="flex min-h-11 items-center justify-between rounded-xl border border-line px-4 text-sm text-cream transition-colors hover:border-cream/25"
          >
            Clear saved pieces
            <span className="text-[10px] uppercase tracking-[0.16em] text-muted">
              {products.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              for (const look of looks) removeLook(look.id);
              flash("Lookbook cleared.");
            }}
            className="flex min-h-11 items-center justify-between rounded-xl border border-line px-4 text-sm text-cream transition-colors hover:border-cream/25"
          >
            Clear lookbook
            <span className="text-[10px] uppercase tracking-[0.16em] text-muted">
              {looks.length}
            </span>
          </button>
        </div>
        {cleared ? (
          <p role="status" className="text-[11px] text-acid">
            {cleared}
          </p>
        ) : null}
      </Section>

      <p className="pt-2 text-center text-[10px] uppercase tracking-[0.2em] text-muted">
        Wardrobe AI · v1
      </p>
    </div>
  );
}
