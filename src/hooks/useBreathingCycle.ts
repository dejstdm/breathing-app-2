"use client";

import { useEffect, useRef, useState } from "react";
import type { BreathingPhase, BreathingTechnique } from "@/types/breathing";

type Options = {
  onPhase?: (phase: BreathingPhase) => void;
};

// High-precision phase scheduler with drift compensation (±~50ms target)
export function useBreathingCycle(
  technique: BreathingTechnique,
  isActive: boolean,
  options: Options = {}
) {
  const { onPhase } = options;
  const [phase, setPhase] = useState<BreathingPhase>("inhale");
  const [cycle, setCycle] = useState(0);
  const [progress, setProgress] = useState(0); // 0..1 within current phase
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);
  const targetTimeRef = useRef<number>(0);
  const phaseIndexRef = useRef<number>(0); // 0: inhale, 1: hold_in, 2: exhale, 3: hold_out

  const durations = [
    technique.phases.inhale * 1000,
    (technique.phases.hold_in ?? 0) * 1000,
    technique.phases.exhale * 1000,
    (technique.phases.hold_out ?? 0) * 1000,
  ];
  const order: BreathingPhase[] = ["inhale", "hold", "exhale", "hold"];

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
        // Immediately advance if duration is zero
        advancePhase(now);
        return;
      }
      startTimeRef.current = now;
      targetTimeRef.current = now + duration;

      // Use a combination of setTimeout and RAF to hit the target within ±50ms
      const tick = () => {
        const t = performance.now();
        const remaining = targetTimeRef.current - t;
        // Update progress (clamped)
        const p = Math.min(1, Math.max(0, (t - startTimeRef.current) / duration));
        setProgress(p);
        if (remaining <= 16) {
          // Close enough; finish
          advancePhase(t);
        } else {
          // Sleep for remaining - small buffer
          const sleep = Math.max(0, remaining - 24);
          timerRef.current = setTimeout(() => {
            rafRef.current = requestAnimationFrame(() => tick());
          }, sleep);
        }
      };

      // Initial long sleep then refine with RAF near deadline
      const initialSleep = Math.max(0, duration - 48);
      timerRef.current = setTimeout(() => {
        rafRef.current = requestAnimationFrame(() => tick());
      }, initialSleep);
    }

    function advancePhase(now: number) {
      // Move to next phase
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
      // Reset to inhale on stop
      phaseIndexRef.current = 0;
      setPhase("inhale");
      setProgress(0);
      return cancelTimers;
    }

    const now = performance.now();
    // Start at current index (preserves phase on re-activation)
    scheduleNextPhase(now);
    return cancelTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, durations[0], durations[1], durations[2], durations[3]]);

  return { currentPhase: phase, cycle, phaseProgress: progress } as const;
}
