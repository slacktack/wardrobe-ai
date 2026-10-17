"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const subscribeNever = () => () => {};

interface SheetProps {
  open: boolean;
  onClose: () => void;
  label?: string;
  children: ReactNode;
  className?: string;
}

export function Sheet({ open, onClose, label, children, className }: SheetProps) {
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const nodes = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((node) => node.offsetParent !== null);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      const inside = panelRef.current.contains(active);
      const atStart = !inside || active === first || active === panelRef.current;
      const atEnd = !inside || active === last || active === panelRef.current;
      if (event.shiftKey && atStart) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && atEnd) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const focusTimer = window.setTimeout(() => panelRef.current?.focus(), 0);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      restoreRef.current?.focus();
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50">
          <motion.div
            aria-hidden
            onClick={onClose}
            className="absolute inset-0 bg-scrim backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.2 }}
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className={cn(
              "absolute inset-x-0 bottom-0 mx-auto flex max-h-[86dvh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-card border-t border-line bg-surface outline-none",
              className,
            )}
            initial={reduceMotion ? false : { y: 48 }}
            animate={{ y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { y: 56 }}
            transition={reduceMotion ? { duration: 0 } : { type: "spring", damping: 32, stiffness: 340 }}
          >
            <div aria-hidden className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-pill bg-cream/15" />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-2.5 top-2.5 z-10 flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-cream/5 hover:text-cream"
            >
              <X aria-hidden className="h-4 w-4" />
            </button>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-safe">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
