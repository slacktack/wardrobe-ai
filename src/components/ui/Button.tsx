import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "ghost" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex select-none items-center justify-center gap-2 rounded-pill font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:pointer-events-none disabled:opacity-40";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-acid text-acid-ink hover:bg-acid/90",
  ghost: "text-cream hover:bg-cream/5",
  outline: "border border-line text-cream hover:border-cream/25 hover:bg-cream/5",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-11 px-4 text-sm",
  md: "min-h-12 px-5 text-sm",
  lg: "min-h-14 px-6 text-base",
};

export function buttonStyles(opts?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}): string {
  const { variant = "primary", size = "md", className } = opts ?? {};
  return cn(base, variants[variant], sizes[size], className);
}

export type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return <button type={type} className={buttonStyles({ variant, size, className })} {...props} />;
}
