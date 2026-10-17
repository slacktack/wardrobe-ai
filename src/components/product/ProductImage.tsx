"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductImage({
  src,
  alt = "",
  sizes,
  priority = false,
  className,
  fallbackClassName,
}: {
  src?: string | null;
  alt?: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  fallbackClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  const isData = typeof src === "string" && src.startsWith("data:");
  const usable = typeof src === "string" && src.length > 0;

  if (!usable || failed) {
    return (
      <span
        aria-hidden
        className={cn(
          "flex h-full w-full items-center justify-center bg-surface-2 text-muted/60",
          fallbackClassName,
        )}
      >
        <ImageOff className="h-5 w-5" strokeWidth={1.5} />
      </span>
    );
  }

  if (isData) {
    return (
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        referrerPolicy="no-referrer"
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}
