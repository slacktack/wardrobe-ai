"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/store";
import { IconButton } from "@/components/ui/IconButton";

export function ThemeToggle() {
  const { resolved, toggle } = useTheme();
  const dark = resolved === "dark";

  return (
    <IconButton
      label={dark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={toggle}
      size="sm"
      icon={dark ? Moon : Sun}
    />
  );
}
