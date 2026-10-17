import { cn, discountPct, formatINR } from "@/lib/utils";

export type PriceTagSize = "sm" | "md" | "lg";

const priceStyles: Record<PriceTagSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl",
};

const mrpStyles: Record<PriceTagSize, string> = {
  sm: "text-[11px]",
  md: "text-xs",
  lg: "text-sm",
};

const offStyles: Record<PriceTagSize, string> = {
  sm: "text-[10px]",
  md: "text-[11px]",
  lg: "text-xs",
};

export function PriceTag({
  price,
  mrp,
  size = "md",
  showOff = true,
  className,
}: {
  price: number;
  mrp?: number;
  size?: PriceTagSize;
  showOff?: boolean;
  className?: string;
}) {
  const off = discountPct(price, mrp);

  return (
    <span
      className={cn("flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5", className)}
    >
      <span className={cn("font-medium leading-none text-cream", priceStyles[size])}>
        {formatINR(price)}
      </span>
      {mrp && mrp > price ? (
        <span className={cn("leading-none text-muted line-through", mrpStyles[size])}>
          {formatINR(mrp)}
        </span>
      ) : null}
      {showOff && off !== null ? (
        <span className={cn("font-medium leading-none text-accent", offStyles[size])}>
          {off}% off
        </span>
      ) : null}
    </span>
  );
}
