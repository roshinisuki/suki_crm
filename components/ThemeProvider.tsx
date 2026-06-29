"use client";

import { useEffect } from "react";

export function ThemeProvider() {
  useEffect(() => {
    // Map legacy Prisma theme names to new theme keys
    const LEGACY_THEME_MAP: Record<string, string> = {
      ember: "orange",
      ocean: "blue",
      forest: "green",
      obsidian: "purple",
      black: "purple",
    };

    let theme = localStorage.getItem("suki-theme") || localStorage.getItem("crm-theme-color") || "orange";
    let mode = localStorage.getItem("suki-mode") || localStorage.getItem("crm-theme-mode") || "light";

    theme = LEGACY_THEME_MAP[theme] || theme;
    
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-mode", mode);
    if (mode === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);

  return null;
}
