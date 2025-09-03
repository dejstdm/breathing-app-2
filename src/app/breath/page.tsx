"use client";

import { useEffect, useMemo, useState } from "react";
import BreathingAnimationV3 from "@/components/breathing/BreathingAnimationV3";
import type { BreathingPattern } from "@/types/breathing";

interface TechniqueV2Api {
  id: string;
  name: string;
  rounds: { phases: BreathingPattern }[];
}

export default function BreathPage() {
  const [pattern, setPattern] = useState<BreathingPattern | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Resolve target technique id: query param > localStorage > first available
  useEffect(() => {
    let cancelled = false;
    async function resolveAndLoad() {
      try {
        const url = new URL(window.location.href);
        const qp = url.searchParams.get('tech');
        let id = qp || null;
        if (!id) {
          try { id = localStorage.getItem('app.lastTechnique'); } catch {}
        }
        if (!id) {
          const listRes = await fetch('/api/techniques', { cache: 'no-store' });
          const listData = await listRes.json();
          const first = Array.isArray(listData.items) && listData.items.length > 0 ? listData.items[0] : null;
          if (first) id = first.id;
        }
        if (!id) throw new Error('No techniques available');

        const res = await fetch(`/api/techniques/${encodeURIComponent(id)}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Failed to load technique (${res.status})`);
        const data: TechniqueV2Api = await res.json();
        const p = data?.rounds?.[0]?.phases;
        if (!p) throw new Error('Technique has no rounds');
        if (!cancelled) setPattern({
          inhale: p.inhale ?? 0,
          hold_in: p.hold_in ?? 0,
          exhale: p.exhale ?? 0,
          hold_out: p.hold_out ?? 0,
        });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to load';
        if (!cancelled) setError(msg);
      }
    }
    resolveAndLoad();
    return () => { cancelled = true; };
  }, []);

  const content = useMemo(() => {
    if (error) return <div className="text-sm text-destructive">{error}</div>;
    if (!pattern) return <div className="text-sm opacity-70">Loading…</div>;
    return <BreathingAnimationV3 pattern={pattern} />;
  }, [pattern, error]);

  return (
    <div className="breath min-h-dvh w-full relative overflow-hidden touch-pan-y flex items-center justify-center">
      {content}
    </div>
  );
}
