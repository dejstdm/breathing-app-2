"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import BreathingAnimationV3 from "@/components/breathing/BreathingAnimationV3";
import type { BreathingPattern, TechniqueMessageType } from "@/types/breathing";
import { useHeader } from "@/components/layout/HeaderProvider";
import BottomBar from "@/components/breathing/BottomBar";
import MessageCenter, { type ToastMessage } from "@/components/breathing/MessageCenter";
import BreathControls from "@/components/breathing/BreathControls";
import BreathDebugHUD from "@/components/breathing/BreathDebugHUD";
import CycleChip from "@/components/breathing/CycleChip";

interface TechniqueV2Api {
  id: string;
  name: string;
  rounds: { phases: BreathingPattern; repetitions: number; round_messages?: Array<{ type: TechniqueMessageType; text: string; trigger?: { type: 'repetition' | 'time'; value: number } }> }[];
  cautions?: string[];
  technique_messages?: {
    pre_session?: Array<{ type: TechniqueMessageType; text: string }>;
    on_start?: Array<{ type: TechniqueMessageType; text: string }>;
    on_end?: Array<{ type: TechniqueMessageType; text: string }>;
  };
}

export default function BreathPage() {
  const [pattern, setPattern] = useState<BreathingPattern | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setHeader, resetHeader } = useHeader();
  const [preSession, setPreSession] = useState<Array<{ type: 'info' | 'warning' | 'success'; text: string }> | undefined>(undefined);
  const [onStartMsgs, setOnStartMsgs] = useState<Array<{ type: TechniqueMessageType; text: string }> | undefined>(undefined);
  const [onEndMsgs, setOnEndMsgs] = useState<Array<{ type: TechniqueMessageType; text: string }> | undefined>(undefined);
  const [roundMsgs, setRoundMsgs] = useState<Array<{ type: TechniqueMessageType; text: string; trigger?: { type: 'repetition' | 'time'; value: number } }> | undefined>(undefined);
  const controlsRef = useRef<{ start: () => void; pause: () => void; reset: () => void } | null>(null);
  const [status, setStatus] = useState<'running' | 'paused' | 'idle'>('idle');
  const prevStatusRef = useRef<'running' | 'paused' | 'idle'>('idle');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [repCount, setRepCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<'inhale' | 'hold_in' | 'exhale' | 'hold_out'>('inhale');
  const firedRef = useRef<Set<string>>(new Set());
  const [debugExtra, setDebugExtra] = useState<{ phaseElapsed?: number; phaseDuration?: number; progress?: number; rafActive?: boolean; internalCycle?: number }>();
  // Debug flag needs to be declared before any effects that use it
  const showDebug = (process.env.NEXT_PUBLIC_DEBUG_BREATH === '1' || process.env.NEXT_PUBLIC_DEBUG_BREATH === 'true');
  const isRunning = status === 'running';
  const isPaused = status === 'paused';

  // Unified handlers so all controls (top + nav) stay in sync
  const handleStart = () => {
    controlsRef.current?.start();
    if (onStartMsgs && onStartMsgs.length) queueMessages(onStartMsgs);
    setElapsed(0);
    setRepCount(0);
    firedRef.current.clear();
  };
  const handlePause = () => {
    controlsRef.current?.pause();
  };
  const handleReset = () => {
    controlsRef.current?.reset();
  };

  // Queue toast helper
  function queueMessages(msgs: Array<{ type: TechniqueMessageType; text: string }>, prefix: string = 'tech') {
    // Only one ephemeral toast visible at a time; newest replaces older.
    const m = msgs[0];
    if (!m) return;
    setToasts([{ id: makeId(prefix), type: m.type, text: m.text, timeoutMs: 3500 }]);
  }

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
        try { localStorage.setItem('app.lastTechnique', data.id); } catch {}
        if (!cancelled) setHeader({ title: data.name, infoItems: data.cautions ?? null });
        if (!cancelled) setPreSession(data.technique_messages?.pre_session);
        if (!cancelled) setOnStartMsgs(data.technique_messages?.on_start);
        if (!cancelled) setOnEndMsgs(data.technique_messages?.on_end);
        if (!cancelled) setRoundMsgs(data.rounds?.[0]?.round_messages);
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

  // Elapsed seconds ticker while running
  useEffect(() => {
    const running = status === 'running' && (!showDebug || debugExtra?.rafActive);
    if (!running) return;
    let cancelled = false;
    const t = window.setInterval(() => {
      if (!cancelled) setElapsed((s) => s + 1);
    }, 1000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [status, showDebug, debugExtra?.rafActive]);

  // Show on_end when session fully stops (to idle)
  useEffect(() => {
    const prev = prevStatusRef.current;
    if ((prev === 'running' || prev === 'paused') && status === 'idle') {
      if (onEndMsgs && onEndMsgs.length) queueMessages(onEndMsgs, 'end');
      setElapsed(0);
      setRepCount(0);
      firedRef.current.clear();
    }
    prevStatusRef.current = status;
  }, [status, onEndMsgs]);

  // Fire round_messages by repetition
  useEffect(() => {
    if (!roundMsgs || roundMsgs.length === 0) return;
    for (let i = 0; i < roundMsgs.length; i++) {
      const m = roundMsgs[i];
      if (m.trigger?.type === 'repetition' && m.trigger.value === repCount) {
        const key = `rep-${i}-${repCount}`;
        if (!firedRef.current.has(key)) {
          firedRef.current.add(key);
          queueMessages([{ type: m.type, text: m.text }], 'round');
        }
      }
    }
  }, [repCount, roundMsgs]);

  // Fire round_messages by elapsed time (seconds)
  useEffect(() => {
    if (!roundMsgs || roundMsgs.length === 0) return;
    for (let i = 0; i < roundMsgs.length; i++) {
      const m = roundMsgs[i];
      if (m.trigger?.type === 'time' && Math.floor(m.trigger.value) === elapsed) {
        const key = `time-${i}-${elapsed}`;
        if (!firedRef.current.has(key)) {
          firedRef.current.add(key);
          queueMessages([{ type: m.type, text: m.text }], 'round');
        }
      }
    }
  }, [elapsed, roundMsgs]);

  const content = useMemo(() => {
    if (error) return <div className="text-sm text-destructive">{error}</div>;
    if (!pattern) return <div className="text-sm opacity-70">Loading…</div>;
    return (
      <BreathingAnimationV3
        pattern={pattern}
        onRegisterControls={(api) => (controlsRef.current = api)}
        onStatusChange={(s) => setStatus(s)}
        onCycleComplete={(count) => setRepCount(count)}
        onPhaseChange={(p) => setPhase(p)}
        onDebugUpdate={showDebug ? (d) => setDebugExtra({
          phaseElapsed: d.phaseElapsed,
          phaseDuration: d.phaseDuration,
          progress: d.progress,
          rafActive: d.rafActive,
          internalCycle: d.internalCycle,
        }) : undefined}
      />
    );
  }, [pattern, error, showDebug]);

  return (
    <div className="breath min-h-dvh w-full relative overflow-hidden touch-pan-y flex items-center justify-center">
      <MessageCenter items={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
      {/* Page-level controls (replaces in-component controls) */}
      <div className="absolute top-20 inset-x-0 z-30 flex justify-center">
        <BreathControls isRunning={isRunning} isPaused={isPaused} onStart={handleStart} onPause={handlePause} onReset={handleReset} />
      </div>

      {content}

      {/* Cycle chip: top-right, under header */}
      <CycleChip value={repCount} />

      {/* Debug HUD above bottom nav (env-gated) */}
      {showDebug && (
        <BreathDebugHUD cycle={repCount} elapsed={elapsed} phase={phase} status={status} extra={debugExtra} />
      )}
      <BottomBar isRunning={isRunning} preSession={preSession} onPlay={handleStart} onPause={handlePause} />
    </div>
  );
}

// Helpers inside module
function makeId(prefix = 'msg') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
