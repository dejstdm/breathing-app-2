"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import BreathingAnimationV3 from "@/components/breathing/BreathingAnimationV3";
import type { BreathingPattern } from "@/types/breathing";
import { useHeader } from "@/components/layout/HeaderProvider";
import BottomBar from "@/components/breathing/BottomBar";

interface TechniqueV2Api {
  id: string;
  name: string;
  rounds: { phases: BreathingPattern }[];
  cautions?: string[];
  technique_messages?: {
    pre_session?: Array<{ type: 'info' | 'warning' | 'success'; text: string }>;
  };
}

export default function BreathPage() {
  const [pattern, setPattern] = useState<BreathingPattern | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setHeader, resetHeader } = useHeader();
  const [preSession, setPreSession] = useState<Array<{ type: 'info' | 'warning' | 'success'; text: string }> | undefined>(undefined);
  const controlsRef = useRef<{ start: () => void; pause: () => void; reset: () => void } | null>(null);
  const [status, setStatus] = useState<'running' | 'paused' | 'idle'>('idle');

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
        // Update header with technique name and cautions
        if (!cancelled) setHeader({ title: data.name, infoItems: data.cautions ?? null });
        if (!cancelled) setPreSession(data.technique_messages?.pre_session);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to load';
        if (!cancelled) setError(msg);
      }
    }
    resolveAndLoad();
    return () => {
      cancelled = true;
      resetHeader();
    };
  }, []);

  const content = useMemo(() => {
    if (error) return <div className="text-sm text-destructive">{error}</div>;
    if (!pattern) return <div className="text-sm opacity-70">Loading…</div>;
    return (
      <BreathingAnimationV3
        pattern={pattern}
        onRegisterControls={(api) => (controlsRef.current = api)}
        onStatusChange={(s) => setStatus(s)}
      />
    );
  }, [pattern, error]);

  return (
    <div className="breath min-h-dvh w-full relative overflow-hidden touch-pan-y flex items-center justify-center">
      {content}
      <BottomBar
        isRunning={status === 'running'}
        preSession={preSession}
        onPlay={() => controlsRef.current?.start()}
        onPause={() => controlsRef.current?.pause()}
      />
    </div>
  );
}
