"use client";

import { useEffect, useRef, useState } from "react";
import type { BreathingPhaseV2, BreathingPattern } from "@/types/breathing";

type Options = {
  onPhase?: (phase: BreathingPhaseV2) => void;
};

export function useBreathingCycleV2(
  pattern: BreathingPattern,
  isActive: boolean,
  options: Options = {}
) {
  const { onPhase } = options;
  const [phase, setPhase] = useState<BreathingPhaseV2>("inhale");
  const [cycle, setCycle] = useState(0);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);
  const targetTimeRef = useRef<number>(0);
  const phaseIndexRef = useRef<number>(0); // 0 inh,1 hold_in,2 exh,3 hold_out

  const durations = [
    pattern.inhale * 1000,
    pattern.hold_in * 1000,
    pattern.exhale * 1000,
    pattern.hold_out * 1000,
  ];
  const order: BreathingPhaseV2[] = ["inhale", "hold_in", "exhale", "hold_out"];

  useEffect(() => {
    function cancelTimers() {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      timerRef.current = null;
      rafRef.current = null;
    }

    function scheduleNextPhase(now: number) {
      const idx = phaseIndexRef.current;
      const duration = durations[idx];
      if (duration === 0) {
        advancePhase(now);
        return;
      }
      startTimeRef.current = now;
      targetTimeRef.current = now + duration;

      const tick = () => {
        const t = performance.now();
        const remaining = targetTimeRef.current - t;
        const d = durations[phaseIndexRef.current] || 1;
        const p = Math.min(1, Math.max(0, (t - startTimeRef.current) / d));
        setProgress(p);
        if (remaining <= 16) {
          advancePhase(t);
        } else {
          const sleep = Math.max(0, remaining - 24);
          timerRef.current = setTimeout(() => {
            rafRef.current = requestAnimationFrame(() => tick());
          }, sleep);
        }
      };

      const initialSleep = Math.max(0, duration - 48);
      timerRef.current = setTimeout(() => {
        rafRef.current = requestAnimationFrame(() => tick());
      }, initialSleep);
    }

    function advancePhase(now: number) {
      const nextIdx = (phaseIndexRef.current + 1) % order.length;
      const nextPhase = order[nextIdx];
      phaseIndexRef.current = nextIdx;
      setPhase(nextPhase);
      setProgress(0);
      onPhase?.(nextPhase);
      if (nextIdx === 0) setCycle((c) => c + 1);
      scheduleNextPhase(now);
    }

    if (!isActive) {
      cancelTimers();
      phaseIndexRef.current = 0;
      setPhase("inhale");
      setProgress(0);
      return cancelTimers;
    }

    const now = performance.now();
    scheduleNextPhase(now);
    return cancelTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, durations[0], durations[1], durations[2], durations[3]]);

  return { currentPhase: phase, cycle, phaseProgress: progress } as const;
}

