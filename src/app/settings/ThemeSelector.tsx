"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/components/layout/ThemeProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";

type Tokens = { background?: string; primary?: string; foreground?: string };

export default function ThemeSelector() {
  const { theme, setTheme, available } = useTheme();
  const [tokens, setTokens] = useState<Record<string, Tokens>>({});
  const [labels, setLabels] = useState<Record<string, string>>({});

  // Load manifest for labels (single source of truth). Colors come from CSS files.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/themes/manifest.json", { cache: "no-store" });
        const data = await res.json();
        const mapLabels: Record<string, string> = {};
        (data.themes || []).forEach((t: { name?: string; label?: string }) => {
          if (t?.name) mapLabels[t.name] = String(t.label || prettyName(t.name));
        });
        if (!cancelled) {
          setLabels(mapLabels);
        }
      } catch {}
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const entries = await Promise.all(
        available.map(async (name) => {
          try {
            const res = await fetch(`/themes/${name}.css`);
            const css = await res.text();
            const root = extractRootVars(css);
            return [name, { background: root.get("--background"), primary: root.get("--primary"), foreground: root.get("--foreground") }] as const;
          } catch {
            return [name, {}] as const;
          }
        })
      );
      if (!cancelled) {
        const map: Record<string, Tokens> = {};
        entries.forEach(([n, t]) => {
          map[n] = t;
        });
        setTokens(map);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [available]);

  const items = useMemo(() => available.map((name) => ({ name, tokens: tokens[name] || {} })), [available, tokens]);

  function toColor(v?: string): string {
    if (!v) return "#111827";
    const t = v.trim();
    // If it looks like an HSL tuple from shadcn (e.g., "222.2 84% 4.9%"), wrap in hsl()
    if (/^[0-9.\s%]+$/.test(t)) return `hsl(${t})`;
    // If it's already a complete color (hex, rgb, hsl function), return as-is
    return t;
  }

  return (
    <div role="radiogroup" aria-label="Select theme" className="theme-selector mt-3 grid grid-cols-2 gap-3 max-w-sm">
      {items.map(({ name, tokens: t }) => {
        const active = theme === name;
        const label = labels[name] || prettyName(name);
        const swatch = t.primary || t.background || "#111827";
        const dot = swatch;
        return (
          <Card
            key={name}
            className={`theme-card group relative cursor-pointer transition-all ${
              active ? "theme-card--active ring-2 ring-primary" : ""
            }`}
            onClick={() => setTheme(name)}
          >
            <CardContent className="p-3">
              <div className="theme-card__header flex items-center justify-between gap-2 mb-3">
                <div className="theme-card__label font-medium capitalize truncate">{label}</div>
                <div
                  className={`theme-card__dot h-2 w-2 rounded-full ${active ? "opacity-100" : "opacity-50"}`}
                  style={{ backgroundColor: toColor(dot) }}
                  aria-hidden
                />
              </div>
              <div className="theme-card__preview h-16 w-full theme-radius border overflow-hidden">
                <div className="theme-card__preview-swatch h-full w-full" style={{ backgroundColor: toColor(swatch) }} />
              </div>
              {active && (
                <div className="theme-card__badge absolute top-2 right-2 inline-flex items-center justify-center rounded-full size-6 bg-background theme-shadow-sm">
                  <Check className="h-3 w-3 text-primary" />
                  <span className="sr-only">Selected theme</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function extractRootVars(css: string): Map<string, string> {
  const map = new Map<string, string>();
  const rootMatch = css.match(/:root\s*\{([\s\S]*?)\}/);
  const body = rootMatch?.[1] ?? "";
  const re = /--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    const key = `--${m[1].trim()}`;
    const value = m[2].trim();
    map.set(key, value);
  }
  return map;
}

function prettyName(s: string) {
  return s.replace(/-/g, " ");
}


