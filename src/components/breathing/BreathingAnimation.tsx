"use client";

import { useEffect, useMemo, useRef } from "react";
import type { BreathingAnimationProps, BreathingPhase } from "@/types/breathing";

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
    const handler = (e: MediaQueryListEvent) => {
      ref.current = e.matches;
    };
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [mq]);
  return ref.current;
}

export default function BreathingAnimation({
  technique,
  isActive,
  currentPhase,
  onPhaseChange,
}: BreathingAnimationProps) {
  const orbRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const lastPhaseRef = useRef<BreathingPhase>(currentPhase);
  const activeAnim = useRef<Animation | null>(null);
  const holdRingAnim = useRef<Animation | null>(null);
  const holdRingRef = useRef<SVGCircleElement | null>(null);

  // Drive orb animation based on currentPhase using Web Animations API
  useEffect(() => {
    const el = orbRef.current;
    if (!el) return;

    // Cancel any running animation first
    activeAnim.current?.cancel();
    activeAnim.current = null;

    if (!isActive) {
      // Reset to base scale when inactive
      el.style.transform = `translateZ(0) scale(${MIN_SCALE})`;
      return;
    }

    if (reduced) {
      // Reduced motion: instant transform changes per phase only
      const s = phaseToScale(currentPhase);
      el.style.transform = `translateZ(0) scale(${s})`;
      return;
    }

    const durationMs = phaseToDurationMs(technique, currentPhase);
    const [fromScale, toScale] = phaseToKeyframes(currentPhase);

    if (durationMs <= 0 || fromScale === toScale) {
      // Static phase (hold or zero duration): snap to target
      el.style.transform = `translateZ(0) scale(${toScale})`;
      return;
    }

    const anim = el.animate(
      [
        { transform: `translateZ(0) scale(${fromScale})` },
        { transform: `translateZ(0) scale(${toScale})` },
      ],
      {
        duration: durationMs,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards",
      }
    );
    activeAnim.current = anim;

    return () => {
      anim.cancel();
      activeAnim.current = null;
    };
  }, [isActive, currentPhase, reduced, technique]);

  // Progress arc during hold phase using SVG stroke-dashoffset
  useEffect(() => {
    const circle = holdRingRef.current;
    if (!circle) return;
    // cleanup any previous
    holdRingAnim.current?.cancel();
    holdRingAnim.current = null;

    // Compute circumference from current r
    const r = parseFloat(circle.getAttribute("r") || "45");
    const circumference = 2 * Math.PI * r;
    circle.style.strokeDasharray = `${circumference}`;
    circle.style.strokeDashoffset = `${circumference}`;
    circle.style.transform = "rotate(-90deg)"; // start at top
    circle.style.transformOrigin = "50% 50%";

    if (!isActive || currentPhase !== "hold") {
      // keep hidden when not holding
      circle.style.opacity = "0";
      return;
    }
    circle.style.opacity = "1";
    const dur = technique.phases.hold * 1000;
    if (dur <= 0) return;
    const anim = circle.animate(
      [
        { strokeDashoffset: `${circumference}` },
        { strokeDashoffset: `0` },
      ],
      { duration: dur, easing: "linear", fill: "forwards" }
    );
    holdRingAnim.current = anim;
    return () => {
      anim.cancel();
      holdRingAnim.current = null;
    };
  }, [currentPhase, isActive, technique.phases.hold]);

  // Emit phase changes if phase prop differs from last
  useEffect(() => {
    if (currentPhase !== lastPhaseRef.current) {
      lastPhaseRef.current = currentPhase;
      onPhaseChange?.(currentPhase);
    }
  }, [currentPhase, onPhaseChange]);

  const label = phaseLabel(currentPhase);

  return (
    <div className="breath__stage absolute inset-0 flex items-center justify-center">
      {/* Orb container */}
      <div className="breath__orb relative h-[min(70vh,72vw)] w-[min(70vh,72vw)] max-w-[560px] max-h-[560px]">
        {/* Visual orb */}
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

        {/* Hold progress wedge hugging the orb border (overlay, not clipped) */}
        <svg className="breath__progress pointer-events-none absolute inset-0 z-10" viewBox="0 0 100 100" aria-hidden>
          <circle
            ref={holdRingRef}
            cx="50"
            cy="50"
            r="45" /* ensure r <= 50 - strokeWidth/2 to avoid clipping */
            fill="transparent"
            stroke="var(--primary)"
            strokeWidth="10"
            strokeLinecap="butt"
            style={{ opacity: 0 }}
          />
        </svg>

        {/* Center content for accessibility / reduced motion */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div
            className="breath__label text-base md:text-lg font-semibold tracking-wide select-none"
            style={{ color: "var(--primary)" }}
            aria-live="polite"
          >
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}

function phaseToDurationMs(technique: BreathingAnimationProps["technique"], phase: BreathingPhase) {
  if (phase === "inhale") return technique.phases.inhale * 1000;
  if (phase === "hold") return technique.phases.hold * 1000;
  return technique.phases.exhale * 1000;
}

function phaseToKeyframes(phase: BreathingPhase): [number, number] {
  switch (phase) {
    case "inhale":
      return [MIN_SCALE, MAX_SCALE];
    case "exhale":
      return [MAX_SCALE, MIN_SCALE];
    case "hold":
    default:
      return [MAX_SCALE, MAX_SCALE];
  }
}

function phaseToScale(phase: BreathingPhase): number {
  if (phase === "inhale") return MAX_SCALE;
  if (phase === "exhale") return MIN_SCALE;
  return MAX_SCALE;
}

function phaseLabel(phase: BreathingPhase): string {
  switch (phase) {
    case "inhale":
      return "in";
    case "hold":
      return "hold";
    case "exhale":
    default:
      return "out";
  }
}

// phaseRingShadow removed in favor of SVG progress ring
