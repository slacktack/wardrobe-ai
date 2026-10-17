"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";

export interface ToastData {
  message: string;
  href?: string;
  actionLabel?: string;
}

interface ToastProps {
  toast: ToastData | null;
  onClose: () => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onClose, 6000);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] mx-auto w-full max-w-[430px] px-4 pt-safe"
    >
      <AnimatePresence>
        {toast ? (
          <motion.div
            role="status"
            initial={reduceMotion ? false : { y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { y: -16, opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease: "easeOut" }}
            className="pointer-events-auto mt-3 flex items-center gap-2 rounded-card border border-line bg-surface-2/95 p-2.5 pl-4 shadow-float backdrop-blur-md"
          >
            <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <p className="min-w-0 flex-1 py-1 text-xs leading-snug text-cream">{toast.message}</p>
            {toast.href ? (
              <Link
                href={toast.href}
                onClick={onClose}
                className="flex min-h-11 shrink-0 items-center rounded-pill px-3 text-[11px] font-medium uppercase tracking-[0.14em] text-accent"
              >
                {toast.actionLabel ?? "Open"}
              </Link>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              aria-label="Dismiss"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:text-cream"
            >
              <X aria-hidden className="h-4 w-4" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
