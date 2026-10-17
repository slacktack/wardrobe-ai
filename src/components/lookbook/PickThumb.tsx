// Product thumbnail with a neutral fallback - remote images, fixed aspect box.

import { cn } from "@/lib/utils";

export function PickThumb({
  image,
  className,
}: {
  image?: string;
  className?: string;
}) {
  if (!image) {
    return (
      <div
        aria-hidden
        className={cn(
          "grid aspect-[3/4] w-14 shrink-0 place-items-center rounded-lg border border-line bg-surface-2",
          className,
        )}
      >
        <span className="font-serif text-sm text-muted/60">--</span>
      </div>
    );
  }
  return (
    <img
      src={image}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      className={cn(
        "aspect-[3/4] w-14 shrink-0 rounded-lg border border-line bg-surface-2 object-cover",
        className,
      )}
    />
  );
}
