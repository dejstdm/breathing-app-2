"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BreathingPhaseV2, BreathingPattern } from "@/types/breathing";

function usePrefersReducedMotion() {
  // Guard against environments without matchMedia (e.g., JSDOM)
  const mq = useMemo(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return null;
    }
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)");
    } catch {
      return null;
    }
  }, []);
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

interface BreathingAnimationV3Props {
  pattern: BreathingPattern;
  onStatusChange?: (status: 'running' | 'paused' | 'idle') => void;
  onRegisterControls?: (api: { start: () => void; pause: () => void; reset: () => void }) => void;
  onCycleComplete?: (count: number) => void;
  onPhaseChange?: (phase: BreathingPhaseV2) => void;
  onDebugUpdate?: (data: {
    phase: BreathingPhaseV2;
    phaseElapsed: number;
    phaseDuration: number;
    progress: number;
    internalCycle: number;
    rafActive: boolean;
    isPaused: boolean;
    isRunning: boolean;
  }) => void;
}

export default function BreathingAnimationV3({
  pattern,
  onStatusChange,
  onRegisterControls,
  onCycleComplete,
  onPhaseChange,
  onDebugUpdate,
}: BreathingAnimationV3Props) {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<BreathingPhaseV2>('inhale');
  
  const blueCircleRef = useRef<HTMLDivElement | null>(null);
  const progressRingRef = useRef<HTMLDivElement | null>(null);
  const progressCircleRef = useRef<SVGCircleElement | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const watchdogIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentPhaseRef = useRef<BreathingPhaseV2>('inhale');
  const phaseStartTimeRef = useRef<number | null>(null);
  const elapsedInPhaseRef = useRef(0);
  const isRunningRef = useRef(false);
  const isPausedRef = useRef(false);
  const resumeElapsedRef = useRef<number | null>(null);
  const lastFrameAtRef = useRef<number>(0);
  const cycleCountRef = useRef(0);
  const reduced = usePrefersReducedMotion();

  // Calculate circumference for progress ring
  const radius = 47.5;
  const circumference = 2 * Math.PI * radius;

  // Phase names for display
  const phaseNames = {
    inhale: 'Breathe In',
    hold_in: 'Hold',
    exhale: 'Breathe Out',
    hold_out: 'Hold'
  };

  // Phase text for center
  const phaseTexts = {
    inhale: 'in',
    hold_in: 'hold',
    exhale: 'out',
    hold_out: 'hold'
  };

  const resetStyles = () => {
    const blueCircle = blueCircleRef.current;
    const progressRing = progressRingRef.current;
    const progressCircle = progressCircleRef.current;
    
    if (blueCircle) {
      // Preserve base class; only manipulate inline styles
      blueCircle.style.transform = 'scale(0)';
      blueCircle.style.animation = '';
    }
    
    if (progressRing) {
      progressRing.classList.remove('opacity-100');
      progressRing.classList.add('opacity-0');
    }
    
    if (progressCircle) {
      progressCircle.style.strokeDashoffset = String(circumference);
    }
  };

  const animate = (timestamp: number) => {
    if (isPausedRef.current) {
      return;
    }
    if (phaseStartTimeRef.current === null || resumeElapsedRef.current != null) {
      const adj = resumeElapsedRef.current ?? 0;
      phaseStartTimeRef.current = timestamp - adj * 1000;
      resumeElapsedRef.current = null;
    }
    const elapsed = ((timestamp - (phaseStartTimeRef.current ?? timestamp)) / 1000);
    lastFrameAtRef.current = timestamp;
    const activePhase = currentPhaseRef.current;
    const phaseDuration = phaseToDurationSeconds(pattern, activePhase);
    // Tolerance to meet ±50ms requirement
    const EPS = 0.05; // seconds
    const safeDuration = Math.max(phaseDuration, EPS);
    const progress = Math.min(elapsed / safeDuration, 1);
    elapsedInPhaseRef.current = Math.min(elapsed, phaseDuration);

    // Update seconds counter (prevent negative values)
    const remainingSeconds = Math.max(0, Math.ceil(phaseDuration - elapsed));
    setCurrentSeconds(remainingSeconds);

    const blueCircle = blueCircleRef.current;
    const progressRing = progressRingRef.current;
    const progressCircle = progressCircleRef.current;

    const applyPhaseStyles = (phase: BreathingPhaseV2, p: number) => {
      switch (phase) {
        case 'inhale':
          if (blueCircle) {
            if (!reduced) {
              const s = Math.min(Math.max(p, 0), 1);
              blueCircle.style.transform = `scale(${s})`;
              blueCircle.style.animation = '';
            } else {
              blueCircle.style.transform = 'scale(1)';
              blueCircle.style.animation = '';
            }
          }
          break;
        case 'hold_in':
          if (blueCircle) {
            blueCircle.style.transform = 'scale(1)';
            blueCircle.style.animation = '';
          }
          if (progressCircle) {
            const holdInOffset = circumference - (p * circumference);
            progressCircle.style.strokeDashoffset = String(holdInOffset);
          }
          break;
        case 'exhale':
          if (blueCircle) {
            if (!reduced) {
              const s = Math.min(Math.max(1 - p, 0), 1);
              blueCircle.style.transform = `scale(${s})`;
              blueCircle.style.animation = '';
            } else {
              blueCircle.style.transform = 'scale(0)';
              blueCircle.style.animation = '';
            }
          }
          if (progressCircle) {
            progressCircle.style.strokeDashoffset = String(circumference);
          }
          break;
        case 'hold_out':
          if (blueCircle) {
            blueCircle.style.transform = 'scale(0)';
            blueCircle.style.animation = '';
          }
          if (progressCircle) {
            const holdOutOffset = circumference - (p * circumference);
            progressCircle.style.strokeDashoffset = String(holdOutOffset);
          }
          break;
      }
    };

    switch (activePhase) {
      case 'inhale':
        applyPhaseStyles('inhale', progress);
        break;

      case 'hold_in':
        applyPhaseStyles('hold_in', progress);
        break;

      case 'exhale':
        applyPhaseStyles('exhale', progress);
        break;

      case 'hold_out':
        applyPhaseStyles('hold_out', progress);
        break;
    }

    if (elapsed + EPS >= phaseDuration) {
      const phaseOrder: BreathingPhaseV2[] = ['inhale', 'hold_in', 'exhale', 'hold_out'];
      const currentIndex = phaseOrder.indexOf(activePhase);
      const nextPhase = phaseOrder[(currentIndex + 1) % phaseOrder.length];

      // Update both state and ref immediately
      currentPhaseRef.current = nextPhase;
      setCurrentPhase(nextPhase);
      onPhaseChange?.(nextPhase);
      phaseStartTimeRef.current = timestamp; // reset baseline for next phase

      // Apply next phase initial styles immediately so UI reflects the boundary transition
      applyPhaseStyles(nextPhase, 0);

      if (nextPhase === 'hold_in' || nextPhase === 'hold_out') {
        if (progressCircle) {
          progressCircle.style.strokeDashoffset = String(circumference);
        }
      }

      // Count full cycles when we wrap to inhale after hold_out
      if (activePhase === 'hold_out' && nextPhase === 'inhale') {
        cycleCountRef.current += 1;
        if (onCycleComplete) onCycleComplete(cycleCountRef.current);
      }
    }

    if (isRunningRef.current && !isPausedRef.current) {
      animationIdRef.current = requestAnimationFrame(animate);
    }

    // Emit debug snapshot for HUD
    onDebugUpdate?.({
      phase: activePhase,
      phaseElapsed: elapsedInPhaseRef.current,
      phaseDuration,
      progress,
      internalCycle: cycleCountRef.current,
      rafActive: !!animationIdRef.current,
      isPaused: isPausedRef.current,
      isRunning: isRunningRef.current,
    });
  };

  const startAnimation = () => {
    if (isPaused) {
      setIsPaused(false);
      isPausedRef.current = false;
      // Resume from where we paused
      resumeElapsedRef.current = elapsedInPhaseRef.current;
    } else {
      phaseStartTimeRef.current = null; // Will be set on first frame
      elapsedInPhaseRef.current = 0;
      resumeElapsedRef.current = null;
      resetStyles();
    }
    
    setIsRunning(true);
    isRunningRef.current = true;
    animationIdRef.current = requestAnimationFrame(animate);
    // Watchdog: ensure RAF resumes if it stalls (e.g., rapid toggle)
    if (watchdogIdRef.current) clearInterval(watchdogIdRef.current);
    watchdogIdRef.current = setInterval(() => {
      const staleForMs = performance.now() - lastFrameAtRef.current;
      if (isRunningRef.current && !isPausedRef.current && (animationIdRef.current == null || staleForMs > 250)) {
        animationIdRef.current = requestAnimationFrame(animate);
      }
    }, 200);
    onStatusChange?.('running');
  };

  const pauseAnimation = () => {
    setIsPaused(true);
    isPausedRef.current = true;
    setIsRunning(false);
    isRunningRef.current = false;
    // Immediately freeze any CSS animation side-effects
    if (blueCircleRef.current) blueCircleRef.current.style.animation = '';
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
    if (watchdogIdRef.current) {
      clearInterval(watchdogIdRef.current);
      watchdogIdRef.current = null;
    }
    onDebugUpdate?.({
      phase: currentPhaseRef.current,
      phaseElapsed: elapsedInPhaseRef.current,
      phaseDuration: phaseToDurationSeconds(pattern, currentPhaseRef.current),
      progress: Math.min(1, Math.max(0, elapsedInPhaseRef.current / Math.max(phaseToDurationSeconds(pattern, currentPhaseRef.current), 0.0001))),
      internalCycle: cycleCountRef.current,
      rafActive: false,
      isPaused: true,
      isRunning: false,
    });
    onStatusChange?.('paused');
  };

  const resetAnimation = () => {
    setIsRunning(false);
    isRunningRef.current = false;
    setIsPaused(false);
    isPausedRef.current = false;
    phaseStartTimeRef.current = null;
    setCurrentSeconds(0);
    cycleCountRef.current = 0;
    
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
    if (watchdogIdRef.current) {
      clearInterval(watchdogIdRef.current);
      watchdogIdRef.current = null;
    }
    resetStyles();
    currentPhaseRef.current = 'inhale';
    setCurrentPhase('inhale');
    onPhaseChange?.('inhale');
    onDebugUpdate?.({
      phase: 'inhale',
      phaseElapsed: 0,
      phaseDuration: phaseToDurationSeconds(pattern, 'inhale'),
      progress: 0,
      internalCycle: cycleCountRef.current,
      rafActive: false,
      isPaused: false,
      isRunning: false,
    });
    onStatusChange?.('idle');
  };

  // Initialize progress circle
  useEffect(() => {
    const progressCircle = progressCircleRef.current;
    if (progressCircle) {
      progressCircle.style.strokeDasharray = String(circumference);
      progressCircle.style.strokeDashoffset = String(circumference);
    }
  }, [circumference]);

  // Update aria-live text via DOM when phase updates if needed in future
  
  // Register external controls once on mount
  useEffect(() => {
    if (onRegisterControls) {
      onRegisterControls({ start: startAnimation, pause: pauseAnimation, reset: resetAnimation });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup on unmount: cancel RAF and watchdog
  useEffect(() => {
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      if (watchdogIdRef.current) {
        clearInterval(watchdogIdRef.current);
        watchdogIdRef.current = null;
      }
    };
  }, []);

  // Emit initial status
  useEffect(() => {
    onStatusChange?.('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="breathing-v3__animation-container relative w-[min(90vw,90vh)] aspect-square max-w-[400px] flex justify-center items-center">
        {/* Outer ring */}
        <div className="breathing-v3__outer-ring absolute inset-0 border-4 border-primary rounded-full" />
        
        {/* Progress ring for holds */}
        <div 
          ref={progressRingRef}
          className={`breathing-v3__progress-ring absolute -inset-[5%] rounded-full transform -rotate-90 transition-opacity duration-300 ${
            currentPhase === 'hold_in' || currentPhase === 'hold_out' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <svg className="breathing-v3__progress-svg w-full h-full" viewBox="0 0 100 100">
            <circle
              ref={progressCircleRef}
              cx="50"
              cy="50"
              r="47.5"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              className="breathing-v3__progress-circle text-primary"
            />
          </svg>
        </div>
        
        {/* Blue circle (breathing orb) */}
        <div
          ref={blueCircleRef}
          className="breathing-v3__orb absolute w-[98.5%] h-[98.5%] bg-primary rounded-full transform scale-0 origin-center"
        />
        
        {/* Center content */}
        <div className="breathing-v3__center-content text-accent absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
          <div className="breathing-v3__phase-text  font-bold text-[clamp(2rem,8vw,4rem)] tracking-tight">
            {isRunning || isPaused ? phaseTexts[currentPhase] : 'in'}
          </div>
          {(isRunning || isPaused) && (
            <div className="breathing-v3__seconds-counter font-semibold text-[clamp(1rem,4vw,1.5rem)] mt-2 tracking-tight">
              {currentSeconds}s
            </div>
          )}
        </div>
    </div>
  );
}

function phaseToDurationSeconds(pattern: BreathingPattern, phase: BreathingPhaseV2): number {
  switch (phase) {
    case "inhale":
      return pattern.inhale;
    case "hold_in":
      return pattern.hold_in;
    case "exhale":
      return pattern.exhale;
    case "hold_out":
    default:
      return pattern.hold_out;
  }
}
