"use client";

import { useState, useEffect, useCallback } from "react";

export type ThemeName = "orange" | "blue" | "green" | "purple";
export type ThemeMode = "light" | "dark";

export const validThemes: ThemeName[] = ["orange", "blue", "green", "purple"];
export const validModes: ThemeMode[] = ["light", "dark"];

/** Map legacy Prisma theme names to new theme keys */
const LEGACY_THEME_MAP: Record<string, ThemeName> = {
  ember: "orange",
  ocean: "blue",
  forest: "green",
  obsidian: "purple",
  black: "purple",
};

/** Map new theme keys back to legacy Prisma names for backend persistence */
export const THEME_TO_LEGACY: Record<ThemeName, string> = {
  orange: "ember",
  blue: "ocean",
  green: "forest",
  purple: "obsidian",
};

function migrateTheme(t: string): ThemeName {
  if (validThemes.includes(t as ThemeName)) return t as ThemeName;
  if (LEGACY_THEME_MAP[t]) return LEGACY_THEME_MAP[t];
  return "orange";
}

export function getInitialTheme(): ThemeName {
  if (typeof window === "undefined") return "orange";
  const stored = localStorage.getItem("suki-theme");
  if (stored) return migrateTheme(stored);
  // Fallback: read from DOM attribute (may be set by FOUC script)
  const domAttr = document.documentElement.getAttribute("data-theme");
  if (domAttr) return migrateTheme(domAttr);
  // Check old localStorage key
  const oldStored = localStorage.getItem("crm-theme-color");
  if (oldStored) return migrateTheme(oldStored);
  return "orange";
}

export function getInitialMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("suki-mode");
  if (stored === "light" || stored === "dark") return stored;
  // Fallback: read from DOM attribute
  const domAttr = document.documentElement.getAttribute("data-mode");
  if (domAttr === "light" || domAttr === "dark") return domAttr as ThemeMode;
  // Check old localStorage key
  const oldStored = localStorage.getItem("crm-theme-mode");
  if (oldStored === "light" || oldStored === "dark") return oldStored as ThemeMode;
  // Check class
  if (document.documentElement.classList.contains("dark")) return "dark";
  return "light";
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeName>(getInitialTheme);
  const [mode, setModeState] = useState<ThemeMode>(getInitialMode);

  // Sync to DOM + localStorage
  const applyTheme = useCallback((t: ThemeName, m: ThemeMode) => {
    document.documentElement.setAttribute("data-theme", t);
    document.documentElement.setAttribute("data-mode", m);
    if (m === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("suki-theme", t);
    localStorage.setItem("suki-mode", m);
    // Dispatch custom event for same-tab listeners
    window.dispatchEvent(new CustomEvent("suki-theme-change", { detail: { theme: t, mode: m } }));
  }, []);

  // Apply on mount
  useEffect(() => {
    applyTheme(theme, mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cross-tab sync via storage event
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "suki-theme") setThemeState(getInitialTheme());
      if (e.key === "suki-mode") setModeState(getInitialMode());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = useCallback((t: ThemeName) => {
    setThemeState(t);
    applyTheme(t, mode);
  }, [mode, applyTheme]);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    applyTheme(theme, m);
  }, [theme, applyTheme]);

  const toggleMode = useCallback(() => {
    const next: ThemeMode = mode === "light" ? "dark" : "light";
    setModeState(next);
    applyTheme(theme, next);
  }, [theme, mode, applyTheme]);

  return { theme, mode, setTheme, setMode, toggleMode };
}
