"use client";

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

interface ApiItem {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration_minutes?: number;
}

export default function TechniqueSelector() {
  const [items, setItems] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch('/api/techniques', { cache: 'no-store' });
        if (!res.ok) throw new Error(`Failed to load techniques (${res.status})`);
        const data = await res.json();
        if (!cancelled) setItems(Array.isArray(data.items) ? data.items : []);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to load techniques';
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const prettyDifficulty = (d: ApiItem['difficulty']) => d;

  const handleSelect = (id: string) => {
    try {
      localStorage.setItem('app.lastTechnique', id);
    } catch {}
    router.push(`/breath?tech=${encodeURIComponent(id)}`);
  };

  const list = useMemo(() => items, [items]);

  if (loading) return <div className="technique-selector__loading text-sm opacity-70">Loading techniques…</div>;
  if (error) return <div className="technique-selector__error text-sm text-destructive">{error}</div>;

  return (
    <div className="technique-selector grid grid-cols-1 sm:grid-cols-2 gap-3">
      {list.map((t) => (
        <button
          key={t.id}
          onClick={() => handleSelect(t.id)}
          className="text-left"
          aria-label={`Select ${t.name}`}
        >
          <Card className="technique-card h-full cursor-pointer transition-colors hover:bg-accent/30">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base leading-tight">{t.name}</CardTitle>
                <span className="inline-flex items-center rounded-full bg-secondary text-secondary-foreground px-2 py-0.5 text-[11px] capitalize">
                  {prettyDifficulty(t.difficulty)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground line-clamp-3">{t.description}</p>
              {typeof t.estimated_duration_minutes === 'number' && (
                <div className="text-xs opacity-70 mt-2">~{t.estimated_duration_minutes} min</div>
              )}
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}
