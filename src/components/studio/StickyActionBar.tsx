import Link from "next/link";
import { Button, buttonStyles } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";

export function StickyActionBar({
  found,
  total,
  price,
  saved,
  onSave,
  onStartOver,
}: {
  found: number;
  total: number;
  price: number;
  saved: boolean;
  onSave: () => void;
  onStartOver: () => void;
}) {
  const progress = total > 0 ? (found / total) * 100 : 0;

  return (
    <div
      className="fixed inset-x-0 z-30 mx-auto w-full max-w-[430px] px-4"
      style={{ bottom: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="flex items-center gap-3 rounded-card border border-line bg-ink/90 p-3 shadow-[0_-10px_30px_rgba(0,0,0,0.4)] backdrop-blur-md">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-cream">
            {price > 0 ? formatINR(price) : "Finding matches"}
          </p>
          <p className="truncate text-[11px] text-muted">
            {found} of {total} pieces matched
          </p>
          <div aria-hidden className="mt-1.5 h-0.5 w-full bg-line">
            <div className="h-0.5 bg-acid transition-[width] duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onStartOver} className="px-3">
          New photo
        </Button>
        {saved ? (
          <Link href="/lookbook" className={buttonStyles({ size: "sm" })}>
            Open lookbook
          </Link>
        ) : (
          <Button size="sm" disabled={found === 0} onClick={onSave}>
            Save look
          </Button>
        )}
      </div>
    </div>
  );
}
