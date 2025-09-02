"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ThemeName = string;
type ColorScheme = "light" | "dark" | "system";

type ThemeManifest = {
  version?: number;
  default?: ThemeName;
  themes?: { name: ThemeName; label?: string; swatch?: string }[];
};

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  scheme: ColorScheme;
  setScheme: (s: ColorScheme) => void;
  available: ThemeName[];
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = "app.theme";
const SCHEME_STORAGE_KEY = "app.scheme";
const DEFAULT_THEME: ThemeName = "amethyst-haze";
const DEFAULT_SCHEME: ColorScheme = "system";

function themeHref(name: ThemeName) {
  return `/themes/${name}.css`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(DEFAULT_THEME);
  const [scheme, setSchemeState] = useState<ColorScheme>(DEFAULT_SCHEME);
  const [systemDark, setSystemDark] = useState<boolean | null>(null);
  const [available, setAvailable] = useState<ThemeName[]>(["amethyst-haze", "amber-minimal", "bubblegum", "mono"]);

  // Load initial theme from localStorage
  useEffect(() => {
    try {
      const savedScheme = localStorage.getItem(SCHEME_STORAGE_KEY) as ColorScheme | null;
      if (savedScheme === "light" || savedScheme === "dark" || savedScheme === "system") {
        setSchemeState(savedScheme);
      }
    } catch {}
  }, []);

  // Load theme manifest and initial theme
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/themes/manifest.json", { cache: "no-store" });
        if (!res.ok) throw new Error("manifest fetch failed");
        const manifest = (await res.json()) as ThemeManifest;
        const names = (manifest.themes ?? []).map((t) => t.name);
        if (!cancelled && names.length) setAvailable(names);
        // Determine initial theme
        let initial: ThemeName | null = null;
        try {
          initial = (localStorage.getItem(THEME_STORAGE_KEY) as ThemeName | null) ?? null;
        } catch {}
        const fallback = manifest.default || DEFAULT_THEME;
        const chosen = initial && names.includes(initial) ? initial : fallback;
        if (!cancelled && chosen) setThemeState(chosen);
      } catch {
        // fallback to defaults; also include mono in fallback list
        let initial: ThemeName | null = null;
        try {
          initial = (localStorage.getItem(THEME_STORAGE_KEY) as ThemeName | null) ?? null;
        } catch {}
        const fallback = DEFAULT_THEME;
        const names = ["amethyst-haze", "amber-minimal", "bubblegum", "mono"];
        if (!cancelled) setAvailable(names);
        const chosen = initial && names.includes(initial) ? initial : fallback;
        if (!cancelled) setThemeState(chosen);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Track system color scheme
  useEffect(() => {
    const m = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemDark(m?.matches ?? false);
    update();
    m?.addEventListener?.("change", update);
    return () => m?.removeEventListener?.("change", update);
  }, []);

  const effectiveDark = scheme === "dark" || (scheme === "system" && systemDark === true);

  // Inject or update <link id="app-theme">
  useEffect(() => {
    const id = "app-theme";
    let el = document.getElementById(id) as HTMLLinkElement | null;
    if (!el) {
      el = document.createElement("link");
      el.id = id;
      el.rel = "stylesheet";
      document.head.appendChild(el);
    }
    el.href = themeHref(theme);
  }, [theme]);

  // Apply dark class and attribute for CSS to target
  useEffect(() => {
    const root = document.documentElement;
    root.toggleAttribute("data-color-scheme", true);
    root.setAttribute("data-color-scheme", effectiveDark ? "dark" : "light");
    root.classList.toggle("dark", effectiveDark);
  }, [effectiveDark]);

  const setTheme = useCallback((t: ThemeName) => {
    setThemeState(t);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, t);
    } catch {}
  }, []);

  const setScheme = useCallback((s: ColorScheme) => {
    setSchemeState(s);
    try {
      localStorage.setItem(SCHEME_STORAGE_KEY, s);
    } catch {}
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, scheme, setScheme, available }),
    [theme, setTheme, scheme, setScheme, available]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
