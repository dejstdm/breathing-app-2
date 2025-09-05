"use client";

import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

interface BreathControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

/**
 * Breathing screen controls (Start/Pause/Reset).
 * Presentational only; state is managed by the page.
 */
export default function BreathControls({ isRunning, isPaused, onStart, onPause, onReset }: BreathControlsProps) {
  return (
    <div className="breathing-v3__controls flex gap-2">
      <Button
        onClick={onStart}
        disabled={isRunning && !isPaused}
        size="sm"
        className="breathing-v3__start-btn flex items-center gap-2"
      >
        <Play className="w-4 h-4" />
        Start
      </Button>
      <Button
        onClick={onPause}
        disabled={!isRunning || isPaused}
        size="sm"
        variant="secondary"
        className="breathing-v3__pause-btn flex items-center gap-2"
      >
        <Pause className="w-4 h-4" />
        Pause
      </Button>
      <Button
        onClick={onReset}
        disabled={!isRunning && !isPaused}
        size="sm"
        variant="outline"
        className="breathing-v3__reset-btn flex items-center gap-2"
      >
        <RotateCcw className="w-4 h-4" />
        Reset
      </Button>
    </div>
  );
}

