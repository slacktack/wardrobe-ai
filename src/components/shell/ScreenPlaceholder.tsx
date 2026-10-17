import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ScreenPlaceholder({
  kicker,
  title,
  description,
  children,
  className,
}: {
  kicker: string;
  title: ReactNode;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-1 flex-col px-5 pb-32 pt-10", className)}>
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted">{kicker}</p>
      <h1 className="mt-4 font-serif text-[2.9rem] leading-[0.98] text-cream">{title}</h1>
      {description ? (
        <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-muted">{description}</p>
      ) : null}
      <div className="mt-8 flex flex-1 flex-col">{children}</div>
    </section>
  );
}
