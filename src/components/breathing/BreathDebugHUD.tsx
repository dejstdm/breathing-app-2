"use client";

type Status = 'running' | 'paused' | 'idle';
type Phase = 'inhale' | 'hold_in' | 'exhale' | 'hold_out';

interface BreathDebugHUDProps {
  cycle: number;
  elapsed: number;
  phase: Phase;
  status: Status;
  extra?: {
    phaseElapsed?: number;
    phaseDuration?: number;
    progress?: number;
    rafActive?: boolean;
    internalCycle?: number;
  };
}

/**
 * Debug HUD chip above bottom nav, env-gated by the page.
 */
export default function BreathDebugHUD({ cycle, elapsed, phase, status, extra }: BreathDebugHUDProps) {
  return (
    <div className="breath__debug fixed bottom-16 inset-x-0 mb-3 z-40 flex justify-center">
      <div className="breath__debug__chip bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border border-border shadow-sm rounded-full px-3 py-1 text-xs flex gap-3">
        <span className="breath__debug__item"><span className="opacity-60">cycle</span>: {cycle}</span>
        <span className="breath__debug__item"><span className="opacity-60">time</span>: {elapsed}s</span>
        <span className="breath__debug__item"><span className="opacity-60">phase</span>: {phase}</span>
        <span className="breath__debug__item"><span className="opacity-60">status</span>: {status}</span>
        {extra?.phaseElapsed != null && (
          <span className="breath__debug__item"><span className="opacity-60">phaseElapsed</span>: {extra.phaseElapsed.toFixed(2)}s</span>
        )}
        {extra?.phaseDuration != null && (
          <span className="breath__debug__item"><span className="opacity-60">phaseDur</span>: {extra.phaseDuration.toFixed(2)}s</span>
        )}
        {extra?.progress != null && (
          <span className="breath__debug__item"><span className="opacity-60">progress</span>: {(extra.progress * 100).toFixed(0)}%</span>
        )}
        {extra?.internalCycle != null && (
          <span className="breath__debug__item"><span className="opacity-60">intCycle</span>: {extra.internalCycle}</span>
        )}
        {extra?.rafActive != null && (
          <span className="breath__debug__item"><span className="opacity-60">raf</span>: {extra.rafActive ? 'on' : 'off'}</span>
        )}
      </div>
    </div>
  );
}
