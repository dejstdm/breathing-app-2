"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
import type { BreathingPhaseV2, BreathingPattern } from "@/types/breathing";

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

interface BreathingAnimationV3Props {
  pattern: BreathingPattern;
}

export default function BreathingAnimationV3({
  pattern,
}: BreathingAnimationV3Props) {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<BreathingPhaseV2>('inhale');
  
  const blueCircleRef = useRef<HTMLDivElement | null>(null);
  const progressRingRef = useRef<HTMLDivElement | null>(null);
  const progressCircleRef = useRef<SVGCircleElement | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const currentPhaseRef = useRef<BreathingPhaseV2>('inhale');
  const phaseStartTimeRef = useRef(0);
  const isRunningRef = useRef(false);
  const isPausedRef = useRef(false);
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
      blueCircle.className = 'absolute w-[98.5%] h-[98.5%] bg-primary rounded-full transform scale-0 origin-center transition-transform';
      blueCircle.style.transform = 'scale(0)';
      blueCircle.style.animationDuration = '';
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
    if (!phaseStartTimeRef.current) {
      phaseStartTimeRef.current = timestamp;
    }
    const elapsed = (timestamp - phaseStartTimeRef.current) / 1000;
    const activePhase = currentPhaseRef.current;
    const phaseDuration = phaseToDurationSeconds(pattern, activePhase);
    const progress = Math.min(elapsed / phaseDuration, 1);

    // Update seconds counter (prevent negative values)
    const remainingSeconds = Math.max(0, Math.ceil(phaseDuration - elapsed));
    setCurrentSeconds(remainingSeconds);

    const blueCircle = blueCircleRef.current;
    const progressRing = progressRingRef.current;
    const progressCircle = progressCircleRef.current;

    if (!blueCircle || !progressRing || !progressCircle) return;

    switch (activePhase) {
      case 'inhale':
        if (!reduced) {
          blueCircle.className = 'absolute w-[98.5%] h-[98.5%] bg-primary rounded-full transform origin-center';
          blueCircle.style.animation = `scaleUp ${phaseDuration}s ease-in-out forwards`;
        } else {
          blueCircle.style.transform = 'scale(1)';
        }
        progressRing.classList.remove('opacity-100');
        progressRing.classList.add('opacity-0');
        break;

      case 'hold_in':
        blueCircle.className = 'absolute w-[98.5%] h-[98.5%] bg-primary rounded-full transform origin-center';
        blueCircle.style.transform = 'scale(1)';
        blueCircle.style.animation = '';
        progressRing.classList.remove('opacity-0');
        progressRing.classList.add('opacity-100');
        
        const holdInOffset = circumference - (progress * circumference);
        progressCircle.style.strokeDashoffset = String(holdInOffset);
        break;

      case 'exhale':
        if (!reduced) {
          blueCircle.className = 'absolute w-[98.5%] h-[98.5%] bg-primary rounded-full transform origin-center';
          blueCircle.style.animation = `scaleDown ${phaseDuration}s ease-in-out forwards`;
        } else {
          blueCircle.style.transform = 'scale(0)';
        }
        progressRing.classList.remove('opacity-100');
        progressRing.classList.add('opacity-0');
        progressCircle.style.strokeDashoffset = String(circumference);
        break;

      case 'hold_out':
        blueCircle.className = 'absolute w-[98.5%] h-[98.5%] bg-primary rounded-full transform origin-center';
        blueCircle.style.transform = 'scale(0)';
        blueCircle.style.animation = '';
        progressRing.classList.remove('opacity-0');
        progressRing.classList.add('opacity-100');
        
        const holdOutOffset = circumference - (progress * circumference);
        progressCircle.style.strokeDashoffset = String(holdOutOffset);
        break;
    }

    if (progress >= 1) {
      const phaseOrder: BreathingPhaseV2[] = ['inhale', 'hold_in', 'exhale', 'hold_out'];
      const currentIndex = phaseOrder.indexOf(activePhase);
      const nextPhase = phaseOrder[(currentIndex + 1) % phaseOrder.length];

      // Update both state and ref immediately
      currentPhaseRef.current = nextPhase;
      setCurrentPhase(nextPhase);
      phaseStartTimeRef.current = timestamp; // Set to current timestamp, not 0!

      if (nextPhase === 'hold_in' || nextPhase === 'hold_out') {
        if (progressCircle) {
          progressCircle.style.strokeDashoffset = String(circumference);
        }
      }
    }

    if (isRunningRef.current && !isPausedRef.current) {
      animationIdRef.current = requestAnimationFrame(animate);
    }
  };

  const startAnimation = () => {
    if (isPaused) {
      setIsPaused(false);
      isPausedRef.current = false;
    } else {
      phaseStartTimeRef.current = 0; // Will be set properly on first frame
      resetStyles();
    }
    
    setIsRunning(true);
    isRunningRef.current = true;
    animationIdRef.current = requestAnimationFrame(animate);
  };

  const pauseAnimation = () => {
    setIsPaused(true);
    isPausedRef.current = true;
    setIsRunning(false);
    isRunningRef.current = false;
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
  };

  const resetAnimation = () => {
    setIsRunning(false);
    isRunningRef.current = false;
    setIsPaused(false);
    isPausedRef.current = false;
    phaseStartTimeRef.current = 0;
    setCurrentSeconds(0);
    
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
    resetStyles();
    currentPhaseRef.current = 'inhale';
    setCurrentPhase('inhale');
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

  return (
    <div className="breathing-v3 w-full mx-auto flex flex-col items-center gap-4 p-4">
      {/* Controls */}
      <div className="breathing-v3__controls flex gap-2">
        <Button
          onClick={startAnimation}
          disabled={isRunning && !isPaused}
          size="sm"
          className="breathing-v3__start-btn flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          Start
        </Button>
        <Button
          onClick={pauseAnimation}
          disabled={!isRunning || isPaused}
          size="sm"
          variant="secondary"
          className="breathing-v3__pause-btn flex items-center gap-2"
        >
          <Pause className="w-4 h-4" />
          Pause
        </Button>
        <Button
          onClick={resetAnimation}
          disabled={!isRunning && !isPaused}
          size="sm"
          variant="outline"
          className="breathing-v3__reset-btn flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
      </div>
      
      {/* Phase indicator */}
      <div className="breathing-v3__phase-indicator bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-bold uppercase">
        {isRunning || isPaused ? phaseNames[currentPhase] : 'Ready'}
      </div>
      
      {/* Animation container */}
      <div className="breathing-v3__animation-container relative w-[min(90vw,90vh)] aspect-square max-w-[400px] flex justify-center items-center">
        {/* Outer ring */}
        <div className="breathing-v3__outer-ring absolute inset-0 border-4 border-primary rounded-full" />
        
        {/* Progress ring for holds */}
        <div 
          ref={progressRingRef}
          className="breathing-v3__progress-ring absolute -inset-[5%] rounded-full transform -rotate-90 opacity-0 transition-opacity duration-300"
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

      <style jsx>{`
        @keyframes scaleUp {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }

        @keyframes scaleDown {
          from {
            transform: scale(1);
          }
          to {
            transform: scale(0);
          }
        }
      `}</style>
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
