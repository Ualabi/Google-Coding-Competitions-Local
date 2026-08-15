"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggleButton() {
  const { isDark, toggle } = useTheme();
  return <ThemeToggle isDark={isDark} onToggle={toggle} />;
}
