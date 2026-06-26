"use client";

import { useState, useEffect } from "react";

export const THEME_ACCENTS = {
  orange:    "#F77F00",
  blue:      "#8ECAE6",
  green:     "#65B017",
  purple:    "#4a0875",
  purpleDark:"#b07ce8",
  dark:      "#FFFFFF",
} as const;

export type ThemeAccentKey = keyof typeof THEME_ACCENTS;

function colorKeyToAccent(colorKey: string): ThemeAccentKey {
  if (colorKey === "forest" || colorKey === "green")       return "green";
  if (colorKey === "ocean"  || colorKey === "blue")        return "blue";
  if (colorKey === "purple" || colorKey === "obsidian")    return "purple";
  if (colorKey === "black" || colorKey === "neutral" || colorKey === "dark") return "dark";
  return "orange";
}

function readAccentFromDOM(): ThemeAccentKey {
  if (typeof window === "undefined") return "orange";
  // New system: separate data-theme attribute
  const attr = document.documentElement.getAttribute("data-theme") ?? "orange";
  // Could be "orange", "blue", "green", "purple" (new) or "ember-light" (legacy)
  const sep = attr.lastIndexOf("-");
  const color = sep > 0 ? attr.slice(0, sep) : attr;
  return colorKeyToAccent(color);
}

export function useThemeAccent(): string {
  const [accent, setAccent] = useState<string>(() => {
    if (typeof window !== "undefined") return THEME_ACCENTS[readAccentFromDOM()];
    return THEME_ACCENTS.orange;
  });

  useEffect(() => {
    const update = () => setAccent(THEME_ACCENTS[readAccentFromDOM()]);
    update();

    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    const onThemeChange = () => update();
    window.addEventListener("suki-theme-change", onThemeChange);

    return () => {
      mo.disconnect();
      window.removeEventListener("suki-theme-change", onThemeChange);
    };
  }, []);

  return accent;
}
