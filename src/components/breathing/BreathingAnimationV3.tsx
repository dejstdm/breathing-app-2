"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Bug } from "lucide-react";
import type { BreathingPhaseV2, BreathingPattern } from "@/types/breathing";
import { useToast } from "@/components/ui/toast";
import { useAudioCues } from "@/hooks/useAudioCues";
import { useAudioSettings } from "@/components/audio/AudioSettings";

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
  roundMessages?: Array<{
    type: 'info' | 'warning' | 'success';
    text: string;
    trigger?: { type: 'repetition'; value: number } | { type: 'time'; value: number };
  }>;
  onStatusChange?: (status: 'running' | 'paused' | 'idle') => void;
  onRegisterControls?: (api: { start: () => void; pause: () => void; reset: () => void }) => void;
}

export default function BreathingAnimationV3({
  pattern,
  roundMessages,
  onStatusChange,
  onRegisterControls,
}: BreathingAnimationV3Props) {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<BreathingPhaseV2>('inhale');
  const [showDebug, setShowDebug] = useState(false);
  const [currentRepetition, setCurrentRepetition] = useState(0);
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);
  
  // Audio integration
  const [audioSettings] = useAudioSettings();
  const {
    playPhaseStart,
    playTransition,
    playSessionStart,
    playSessionEnd,
    isLoading: audioLoading,
    error: audioError
  } = useAudioCues(audioSettings);
  
  const blueCircleRef = useRef<HTMLDivElement | null>(null);
  const progressRingRef = useRef<HTMLDivElement | null>(null);
  const progressCircleRef = useRef<SVGCircleElement | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const currentPhaseRef = useRef<BreathingPhaseV2>('inhale');
  const phaseStartTimeRef = useRef(0);
  const pausedElapsedTimeRef = useRef(0); // Track elapsed time when paused
  const currentRepetitionRef = useRef(0);
  const sessionStartTimeRef = useRef(0);
  const pausedSessionTimeRef = useRef(0);
  const triggeredTimeMessagesRef = useRef(new Set<number>());
  const isRunningRef = useRef(false);
  const isPausedRef = useRef(false);
  const lastPhaseRef = useRef<BreathingPhaseV2>('inhale'); // Track phase changes for audio
  const reduced = usePrefersReducedMotion();
  const { addToast } = useToast();

  // Calculate circumference for progress ring - memoized
  const radius = 47.5;
  const circumference = useMemo(() => 2 * Math.PI * radius, []);

  // Memoize phase duration calculation to avoid recalculation every frame
  const phaseDurations = useMemo(() => ({
    inhale: pattern.inhale,
    hold_in: pattern.hold_in,
    exhale: pattern.exhale,
    hold_out: pattern.hold_out
  }), [pattern.inhale, pattern.hold_in, pattern.exhale, pattern.hold_out]);

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

  const resetStyles = useCallback(() => {
    const blueCircle = blueCircleRef.current;
    const progressRing = progressRingRef.current;
    const progressCircle = progressCircleRef.current;
    
    if (blueCircle) {
      blueCircle.style.transform = 'scale(0)';
      blueCircle.style.animation = '';
    }
    
    if (progressRing) {
      progressRing.style.opacity = '0';
    }
    
    if (progressCircle) {
      progressCircle.style.strokeDashoffset = String(circumference);
    }
  }, [circumference]);

  const animate = useCallback((timestamp: number) => {
    if (isPausedRef.current) {
      return;
    }
    if (!phaseStartTimeRef.current) {
      phaseStartTimeRef.current = timestamp;
    }
    if (!sessionStartTimeRef.current) {
      sessionStartTimeRef.current = timestamp;
    }
    
    const elapsed = (timestamp - phaseStartTimeRef.current) / 1000;
    const sessionElapsed = (timestamp - sessionStartTimeRef.current) / 1000 + pausedSessionTimeRef.current;
    
    // Update total elapsed time for display
    setTotalElapsedTime(sessionElapsed);
    
    // Check for time-based messages
    roundMessages?.forEach(message => {
      if (message.trigger?.type === 'time' && 
          sessionElapsed >= message.trigger.value && 
          !triggeredTimeMessagesRef.current.has(message.trigger.value)) {
        triggeredTimeMessagesRef.current.add(message.trigger.value);
        addToast(message.type, message.text, 3000);
      }
    });
    
    // Calculate total elapsed time including any paused time
    const totalElapsed = elapsed + pausedElapsedTimeRef.current;
    const activePhase = currentPhaseRef.current;
    const phaseDuration = phaseDurations[activePhase as keyof typeof phaseDurations];
    const progress = Math.min(totalElapsed / phaseDuration, 1);

    // Update seconds counter only when it changes to reduce state updates
    const remainingSeconds = Math.max(0, Math.ceil(phaseDuration - totalElapsed));
    if (remainingSeconds !== currentSeconds) {
      setCurrentSeconds(remainingSeconds);
    }

    const blueCircle = blueCircleRef.current;
    const progressRing = progressRingRef.current;
    const progressCircle = progressCircleRef.current;

    if (!blueCircle || !progressRing || !progressCircle) return;

    // Use efficient transform-only animations
    switch (activePhase) {
      case 'inhale':
        if (!reduced) {
          const inhaleScale = progress;
          blueCircle.style.transform = `scale(${inhaleScale})`;
        } else {
          blueCircle.style.transform = 'scale(1)';
        }
        // Only toggle visibility when needed
        if (progressRing.style.opacity !== '0') {
          progressRing.style.opacity = '0';
        }
        break;

      case 'hold_in':
        if (blueCircle.style.transform !== 'scale(1)') {
          blueCircle.style.transform = 'scale(1)';
        }
        // Only toggle visibility when needed
        if (progressRing.style.opacity !== '1') {
          progressRing.style.opacity = '1';
        }
        
        const holdInOffset = circumference - (progress * circumference);
        progressCircle.style.strokeDashoffset = String(holdInOffset);
        break;

      case 'exhale':
        if (!reduced) {
          const exhaleScale = 1 - progress;
          blueCircle.style.transform = `scale(${exhaleScale})`;
        } else {
          blueCircle.style.transform = 'scale(0)';
        }
        // Only toggle visibility when needed
        if (progressRing.style.opacity !== '0') {
          progressRing.style.opacity = '0';
          progressCircle.style.strokeDashoffset = String(circumference);
        }
        break;

      case 'hold_out':
        if (blueCircle.style.transform !== 'scale(0)') {
          blueCircle.style.transform = 'scale(0)';
        }
        // Only toggle visibility when needed
        if (progressRing.style.opacity !== '1') {
          progressRing.style.opacity = '1';
        }
        
        const holdOutOffset = circumference - (progress * circumference);
        progressCircle.style.strokeDashoffset = String(holdOutOffset);
        break;
    }

    if (progress >= 1) {
      const phaseOrder: BreathingPhaseV2[] = ['inhale', 'hold_in', 'exhale', 'hold_out'];
      const currentIndex = phaseOrder.indexOf(activePhase);
      const nextPhase = phaseOrder[(currentIndex + 1) % phaseOrder.length];

      // Check if we completed a full cycle (reached the end of hold_out)
      if (activePhase === 'hold_out') {
        const newRepetition = currentRepetitionRef.current + 1;
        currentRepetitionRef.current = newRepetition;
        setCurrentRepetition(newRepetition);
        
        // Check for round messages triggered by repetition
        roundMessages?.forEach(message => {
          if (message.trigger?.type === 'repetition' && message.trigger.value === newRepetition) {
            addToast(message.type, message.text, 3000);
          }
        });
        
        // Play transition sound between cycles if enabled
        if (audioSettings.transitionSounds) {
          playTransition().catch(err => console.warn('Transition audio failed:', err));
        }
      }

      // Play audio cue for phase change
      if (audioSettings.enabled && lastPhaseRef.current !== nextPhase) {
        playPhaseStart(nextPhase).catch(err => console.warn('Phase audio failed:', err));
        lastPhaseRef.current = nextPhase;
      }

      // Update both state and ref immediately
      currentPhaseRef.current = nextPhase;
      setCurrentPhase(nextPhase);
      phaseStartTimeRef.current = timestamp;
      pausedElapsedTimeRef.current = 0; // Reset paused time for new phase

      if (nextPhase === 'hold_in' || nextPhase === 'hold_out') {
        progressCircle.style.strokeDashoffset = String(circumference);
      }
    }

    if (isRunningRef.current && !isPausedRef.current) {
      animationIdRef.current = requestAnimationFrame(animate);
    }
  }, [phaseDurations, reduced, circumference, currentSeconds, roundMessages, addToast, audioSettings, playPhaseStart, playTransition]);

  const startAnimation = useCallback(async () => {
    if (isPaused) {
      // Resuming from pause
      setIsPaused(false);
      isPausedRef.current = false;
      // Reset the phase start time to current time, keeping the paused elapsed time
      phaseStartTimeRef.current = 0; // Will be set on next frame
    } else {
      // Starting fresh
      phaseStartTimeRef.current = 0;
      pausedElapsedTimeRef.current = 0;
      lastPhaseRef.current = 'inhale';
      resetStyles();
      
      // Play session start audio
      if (audioSettings.enabled) {
        try {
          await playSessionStart();
          // Small delay before starting first phase audio
          setTimeout(() => {
            playPhaseStart('inhale').catch(err => console.warn('Start phase audio failed:', err));
          }, 500);
        } catch (err) {
          console.warn('Session start audio failed:', err);
        }
      }
    }
    
    setIsRunning(true);
    isRunningRef.current = true;
    animationIdRef.current = requestAnimationFrame(animate);
    onStatusChange?.('running');
  }, [isPaused, animate, resetStyles, onStatusChange, audioSettings, playSessionStart, playPhaseStart]);

  const pauseAnimation = useCallback(() => {
    if (phaseStartTimeRef.current > 0) {
      // Store how much time has elapsed in the current phase
      const now = performance.now();
      const currentElapsed = (now - phaseStartTimeRef.current) / 1000;
      pausedElapsedTimeRef.current += currentElapsed;
    }
    
    if (sessionStartTimeRef.current > 0) {
      // Store session elapsed time when pausing
      const now = performance.now();
      const sessionElapsed = (now - sessionStartTimeRef.current) / 1000;
      pausedSessionTimeRef.current += sessionElapsed;
      sessionStartTimeRef.current = 0; // Reset to be set again on resume
    }
    
    setIsPaused(true);
    isPausedRef.current = true;
    setIsRunning(false);
    isRunningRef.current = false;
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
    onStatusChange?.('paused');
  }, [onStatusChange]);

  const resetAnimation = useCallback(async () => {
    // Play session end audio before resetting
    if ((isRunning || isPaused) && audioSettings.enabled) {
      try {
        await playSessionEnd();
      } catch (err) {
        console.warn('Session end audio failed:', err);
      }
    }
    
    setIsRunning(false);
    isRunningRef.current = false;
    setIsPaused(false);
    isPausedRef.current = false;
    phaseStartTimeRef.current = 0;
    pausedElapsedTimeRef.current = 0;
    sessionStartTimeRef.current = 0;
    pausedSessionTimeRef.current = 0;
    triggeredTimeMessagesRef.current.clear();
    currentRepetitionRef.current = 0;
    setCurrentSeconds(0);
    setCurrentRepetition(0);
    setTotalElapsedTime(0);
    lastPhaseRef.current = 'inhale';
    
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
    resetStyles();
    currentPhaseRef.current = 'inhale';
    setCurrentPhase('inhale');
    onStatusChange?.('idle');
  }, [resetStyles, onStatusChange, isRunning, isPaused, audioSettings, playSessionEnd]);

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
  }, [onRegisterControls, startAnimation, pauseAnimation, resetAnimation]);

  // Emit initial status
  useEffect(() => {
    onStatusChange?.('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        {process.env.NEXT_PUBLIC_SHOW_DEBUG_BUTTON === 'true' && (
          <Button
            onClick={() => setShowDebug(!showDebug)}
            size="sm"
            variant="ghost"
            className="breathing-v3__debug-btn flex items-center gap-2"
          >
            <Bug className="w-4 h-4" />
            Debug
          </Button>
        )}
      </div>
      
      {/* Debug Panel */}
      {process.env.NEXT_PUBLIC_SHOW_DEBUG_BUTTON === 'true' && showDebug && (
        <div className="breathing-v3__debug bg-muted/50 rounded-lg p-4 text-sm font-mono space-y-2 border">
          <div className="breathing-v3__debug-title font-bold text-center border-b pb-2 mb-2">Debug Information</div>
          <div className="breathing-v3__debug-grid grid grid-cols-2 gap-x-4 gap-y-1">
            <div>Status:</div>
            <div className={`font-semibold ${
              isRunning ? 'text-green-600' : isPaused ? 'text-yellow-600' : 'text-gray-600'
            }`}>
              {isRunning ? 'RUNNING' : isPaused ? 'PAUSED' : 'IDLE'}
            </div>
            
            <div>Phase:</div>
            <div className="font-semibold">{currentPhase}</div>
            
            <div>Remaining:</div>
            <div>{currentSeconds}s</div>
            
            <div>Repetition:</div>
            <div className="font-semibold text-blue-600">{currentRepetition}</div>
            
            <div>Total Time:</div>
            <div className="font-semibold text-green-600">{totalElapsedTime.toFixed(1)}s</div>
            
            <div>Pattern:</div>
            <div>{pattern.inhale}s-{pattern.hold_in}s-{pattern.exhale}s-{pattern.hold_out}s</div>
            
            <div>Paused Time:</div>
            <div>{pausedElapsedTimeRef.current.toFixed(2)}s</div>
            
            <div>Animation ID:</div>
            <div>{animationIdRef.current || 'null'}</div>
            
            <div>Reduced Motion:</div>
            <div>{reduced ? 'YES' : 'NO'}</div>
            
            <div>Phase Start:</div>
            <div>{phaseStartTimeRef.current ? new Date(phaseStartTimeRef.current).toLocaleTimeString() : 'Not started'}</div>
            
            <div>Audio Enabled:</div>
            <div className={audioSettings.enabled ? 'text-green-600' : 'text-gray-600'}>
              {audioSettings.enabled ? 'YES' : 'NO'}
            </div>
            
            <div>Audio Type:</div>
            <div>{audioSettings.voiceType.toUpperCase()}</div>
            
            <div>Audio Loading:</div>
            <div className={audioLoading ? 'text-yellow-600' : 'text-green-600'}>
              {audioLoading ? 'YES' : 'NO'}
            </div>
            
            {audioError && (
              <>
                <div>Audio Error:</div>
                <div className="text-red-600 text-xs">{audioError}</div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Phase indicator */}
      <div className="breathing-v3__phase-indicator bg-primary text-primary-foreground px-4 mb-6 py-2 rounded-full text-sm font-bold uppercase">
        {isRunning || isPaused ? phaseNames[currentPhase] : 'Ready'}
      </div>
      
      {/* Animation container */}
      <div className="breathing-v3__animation-container relative w-[min(90vw,90vh)] aspect-square max-w-[400px] flex justify-center items-center">
        {/* Outer ring */}
        <div className="breathing-v3__outer-ring absolute inset-0 border-4 border-primary rounded-full" />
        
        {/* Progress ring for holds */}
        <div 
          ref={progressRingRef}
          className="breathing-v3__progress-ring absolute -inset-[5%] rounded-full transform -rotate-90 transition-opacity duration-300"
          style={{ opacity: 0 }}
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
          className="breathing-v3__orb absolute w-[98.5%] h-[98.5%] bg-primary rounded-full origin-center"
          style={{ transform: 'scale(0)' }}
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