import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-4 py-10 text-center", className)}>
      {Icon ? <Icon aria-hidden className="h-6 w-6 text-muted" strokeWidth={1.5} /> : null}
      <p className="font-serif text-xl leading-snug text-cream">{title}</p>
      {description ? (
        <p className="max-w-[32ch] text-xs leading-relaxed text-muted">{description}</p>
      ) : null}
      {children}
    </div>
  );
}
