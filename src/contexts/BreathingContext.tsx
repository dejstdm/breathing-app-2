"use client";

import React, { createContext, useContext, useCallback, useState, useRef } from 'react';

export type BreathingStatus = 'idle' | 'running' | 'paused';

interface BreathingContextType {
  status: BreathingStatus;
  isRunning: boolean;
  isPaused: boolean;
  currentRepetition: number;
  play: () => void;
  pause: () => void;
  reset: () => void;
  registerControls: (controls: { start: () => void; pause: () => void; reset: () => void }) => void;
  setStatus: (status: BreathingStatus) => void;
  setCurrentRepetition: (rep: number) => void;
}

const BreathingContext = createContext<BreathingContextType | null>(null);

export function BreathingProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<BreathingStatus>('idle');
  const [currentRepetition, setCurrentRepetition] = useState(0);
  const controlsRef = useRef<{ start: () => void; pause: () => void; reset: () => void } | null>(null);

  const registerControls = useCallback((controls: { start: () => void; pause: () => void; reset: () => void }) => {
    controlsRef.current = controls;
  }, []);

  const play = useCallback(() => {
    controlsRef.current?.start();
  }, []);

  const pause = useCallback(() => {
    controlsRef.current?.pause();
  }, []);

  const reset = useCallback(() => {
    controlsRef.current?.reset();
  }, []);

  const value: BreathingContextType = {
    status,
    isRunning: status === 'running',
    isPaused: status === 'paused',
    currentRepetition,
    play,
    pause,
    reset,
    registerControls,
    setStatus,
    setCurrentRepetition,
  };

  return (
    <BreathingContext.Provider value={value}>
      {children}
    </BreathingContext.Provider>
  );
}

export function useBreathing() {
  const context = useContext(BreathingContext);
  if (!context) {
    throw new Error('useBreathing must be used within a BreathingProvider');
  }
  return context;
}