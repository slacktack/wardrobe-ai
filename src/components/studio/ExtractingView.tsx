"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

const STEPS = ["Reading the fit", "Spotting every piece", "Lining up the best matches"];

export function ExtractingView({ image }: { image: string | null }) {
  const [step, setStep] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const timer = window.setInterval(
      () => setStep((current) => Math.min(current + 1, STEPS.length - 1)),
      2600,
    );
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="pb-safe">
      <section className="flex flex-1 flex-col px-5 pb-28 pt-6">
        <div className="relative overflow-hidden rounded-card border border-line bg-surface-2">
          {image ? (
            <img src={image} alt="Your photo" className="block h-auto max-h-[62dvh] w-full object-cover" />
          ) : (
            <div className="aspect-[3/4] w-full animate-pulse" />
          )}
          <div aria-hidden className="absolute inset-0 bg-ink/30" />
          {reduce ? null : (
            <motion.div
              aria-hidden
              className="absolute inset-x-0 h-24 bg-linear-to-b from-transparent via-acid/25 to-transparent"
              initial={{ top: "-20%" }}
              animate={{ top: ["-20%", "100%"] }}
              transition={{ duration: 2.2, ease: "easeInOut", repeat: Infinity }}
            />
          )}
        </div>
        <motion.p
          key={step}
          role="status"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-7 font-serif text-3xl italic leading-tight text-cream"
        >
          {STEPS[step]}...
        </motion.p>
        <p className="mt-2 text-xs text-muted">Usually takes about ten seconds.</p>
      </section>
    </div>
  );
}
