import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type IconButtonVariant = "ghost" | "outline" | "solid" | "glass";
export type IconButtonSize = "sm" | "md" | "lg";

const base =
  "relative inline-flex shrink-0 select-none items-center justify-center rounded-full transition-[color,background-color,border-color,transform] duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:pointer-events-none disabled:opacity-40";

const variants: Record<IconButtonVariant, string> = {
  ghost: "text-muted hover:bg-cream/5 hover:text-cream",
  outline: "border border-line text-cream hover:border-cream/25 hover:bg-cream/5",
  solid: "bg-cream text-ink hover:bg-cream/90",
  glass: "border border-cream/10 bg-ink/70 text-cream backdrop-blur-md hover:bg-ink/85",
};

const sizes: Record<IconButtonSize, string> = {
  sm: "h-11 w-11",
  md: "h-12 w-12",
  lg: "h-14 w-14",
};

export interface IconButtonProps
  extends Omit<ComponentProps<"button">, "children" | "aria-label"> {
  label: string;
  icon?: LucideIcon;
  children?: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
}

export function IconButton({
  label,
  icon: Icon,
  children,
  variant = "ghost",
  size = "md",
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {Icon ? <Icon aria-hidden className="h-5 w-5" strokeWidth={1.8} /> : children}
    </button>
  );
}
