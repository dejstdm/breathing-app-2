"use client";

import { useEffect, useMemo, useRef } from "react";
import type { BreathingAnimationV2Props, BreathingPhaseV2 } from "@/types/breathing";

const MIN_SCALE = 0.72;
const MAX_SCALE = 1.0;

function usePrefersReducedMotion() {
  const mq = useMemo(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null,
  []);
  const ref = useRef(mq?.matches ?? false);
  useEffect(() => {
    if (!mq) return;
    ref.current = mq.matches;
    const handler = (e: MediaQueryListEvent) => (ref.current = e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [mq]);
  return ref.current;
}

export default function BreathingAnimationV2({
  pattern,
  isActive,
  currentPhase,
  onPhaseChange,
}: BreathingAnimationV2Props) {
  const orbRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const lastPhaseRef = useRef<BreathingPhaseV2>(currentPhase);
  const activeAnim = useRef<Animation | null>(null);
  const holdRingRef = useRef<SVGCircleElement | null>(null);

  useEffect(() => {
    const el = orbRef.current;
    if (!el) return;
    activeAnim.current?.cancel();
    activeAnim.current = null;

    if (!isActive) {
      el.style.transform = `translateZ(0) scale(${MIN_SCALE})`;
      return;
    }
    if (reduced) {
      const s = phaseToScale(currentPhase);
      el.style.transform = `translateZ(0) scale(${s})`;
      return;
    }

    const durationMs = phaseToDurationMs(pattern, currentPhase);
    const [fromScale, toScale] = phaseToKeyframes(currentPhase);
    if (durationMs <= 0 || fromScale === toScale) {
      el.style.transform = `translateZ(0) scale(${toScale})`;
      return;
    }
    const anim = el.animate(
      [
        { transform: `translateZ(0) scale(${fromScale})` },
        { transform: `translateZ(0) scale(${toScale})` },
      ],
      { duration: durationMs, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }
    );
    activeAnim.current = anim;
    return () => {
      anim.cancel();
      activeAnim.current = null;
    };
  }, [isActive, currentPhase, reduced, pattern]);

  // Hold wedge (both holds)
  useEffect(() => {
    const circle = holdRingRef.current;
    if (!circle) return;
    const isHold = currentPhase === "hold_in" || currentPhase === "hold_out";
    circle.getAnimations().forEach((a) => a.cancel());
    // geometry
    const r = 45;
    const circumference = 2 * Math.PI * r;
    circle.setAttribute("r", String(r));
    circle.style.strokeDasharray = `${circumference}`;
    circle.style.strokeDashoffset = `${circumference}`;
    circle.style.transform = "rotate(-90deg)";
    circle.style.transformOrigin = "50% 50%";
    if (!isActive || !isHold) {
      circle.style.opacity = "0";
      return;
    }
    circle.style.opacity = "1";
    const dur = phaseToDurationMs(pattern, currentPhase);
    if (dur <= 0) return;
    circle.animate(
      [
        { strokeDashoffset: `${circumference}` },
        { strokeDashoffset: `0` },
      ],
      { duration: dur, easing: "linear", fill: "forwards" }
    );
  }, [currentPhase, isActive, pattern]);

  useEffect(() => {
    if (currentPhase !== lastPhaseRef.current) {
      lastPhaseRef.current = currentPhase;
      onPhaseChange?.(currentPhase);
    }
  }, [currentPhase, onPhaseChange]);

  const label = phaseLabel(currentPhase);

  return (
    <div className="breath__stage absolute inset-0 flex items-center justify-center">
      <div className="breath__orb relative h-[min(70vh,72vw)] w-[min(70vh,72vw)] max-w-[560px] max-h-[560px]">
        {/* Orb */}
        <div
          ref={orbRef}
          className="breath__orb-visual relative size-full rounded-full border"
          style={{
            transform: `translateZ(0) scale(${MIN_SCALE})`,
            borderColor: "var(--primary)",
            background:
              "var(--breath-orb, color-mix(in oklab, var(--foreground) 80%, var(--background) 20%))",
          }}
          aria-hidden
        />

        {/* Hold wedge over the border */}
        <svg className="breath__progress pointer-events-none absolute inset-0 z-10" viewBox="0 0 100 100" aria-hidden>
          <circle
            ref={holdRingRef}
            cx="50"
            cy="50"
            r="45"
            fill="transparent"
            stroke="var(--primary)"
            strokeWidth="10"
            strokeLinecap="butt"
            style={{ opacity: 0 }}
          />
        </svg>

        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="breath__label text-base md:text-lg font-semibold tracking-wide select-none" style={{ color: "var(--primary)" }} aria-live="polite">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}

function phaseToDurationMs(pattern: BreathingAnimationV2Props["pattern"], phase: BreathingPhaseV2) {
  switch (phase) {
    case "inhale":
      return pattern.inhale * 1000;
    case "hold_in":
      return pattern.hold_in * 1000;
    case "exhale":
      return pattern.exhale * 1000;
    case "hold_out":
    default:
      return pattern.hold_out * 1000;
  }
}

function phaseToKeyframes(phase: BreathingPhaseV2): [number, number] {
  switch (phase) {
    case "inhale":
      return [MIN_SCALE, MAX_SCALE];
    case "exhale":
      return [MAX_SCALE, MIN_SCALE];
    case "hold_in":
      return [MAX_SCALE, MAX_SCALE];
    case "hold_out":
    default:
      return [MIN_SCALE, MIN_SCALE];
  }
}

function phaseToScale(phase: BreathingPhaseV2): number {
  switch (phase) {
    case "inhale":
    case "hold_in":
      return MAX_SCALE;
    case "exhale":
    case "hold_out":
    default:
      return MIN_SCALE;
  }
}

function phaseLabel(phase: BreathingPhaseV2): string {
  switch (phase) {
    case "inhale":
      return "in";
    case "hold_in":
      return "hold";
    case "exhale":
      return "out";
    case "hold_out":
    default:
      return "hold";
  }
}

