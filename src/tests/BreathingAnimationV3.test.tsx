/** @jest-environment jsdom */
import React, { act } from 'react';
import ReactDOM from 'react-dom/client';
import BreathingAnimationV3 from '@/components/breathing/BreathingAnimationV3';
import type { BreathingPattern, BreathingPhaseV2 } from '@/types/breathing';

describe('BreathingAnimationV3', () => {
  let container: HTMLDivElement;
  let root: ReactDOM.Root;
  let now = 0;
  let rafCb: FrameRequestCallback | null = null;
  let controls: { start: () => void; pause: () => void; reset: () => void } | null = null;

  // Mock data
  const testPattern: BreathingPattern = {
    inhale: 2,
    hold_in: 1,
    exhale: 2,
    hold_out: 1
  };

  const fastPattern: BreathingPattern = {
    inhale: 0.2,
    hold_in: 0.1,
    exhale: 0.2,
    hold_out: 0.1
  };

  beforeEach(() => {
    jest.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = ReactDOM.createRoot(container);

    // Time control
    now = 0;
    jest.spyOn(performance, 'now').mockImplementation(() => now);
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(((cb: FrameRequestCallback) => {
      rafCb = cb;
      return 1 as unknown as number;
    }) as typeof window.requestAnimationFrame);
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => { rafCb = null; });

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  afterEach(() => {
    act(() => { root.unmount(); });
    document.body.removeChild(container);
    jest.useRealTimers();
    jest.restoreAllMocks();
    rafCb = null;
    controls = null;
  });

  function frame(msAdvance: number) {
    now += msAdvance;
    jest.advanceTimersByTime(msAdvance);
    if (rafCb) {
      act(() => {
        rafCb(now);
      });
    }
  }

  function getOrb(): HTMLElement {
    const el = container.querySelector('.breathing-v3__orb') as HTMLElement;
    if (!el) throw new Error('orb not found');
    return el;
  }

  function getProgressRing(): HTMLElement {
    const el = container.querySelector('.breathing-v3__progress-ring') as HTMLElement;
    if (!el) throw new Error('progress ring not found');
    return el;
  }

  function getProgressCircle(): SVGCircleElement {
    const el = container.querySelector('.breathing-v3__progress-circle') as SVGCircleElement;
    if (!el) throw new Error('progress circle not found');
    return el;
  }

  function getPhaseText(): HTMLElement {
    const el = container.querySelector('.breathing-v3__phase-text') as HTMLElement;
    if (!el) throw new Error('phase text not found');
    return el;
  }

  function getSecondsCounter(): HTMLElement | null {
    return container.querySelector('.breathing-v3__seconds-counter') as HTMLElement | null;
  }

  function getScale(): number {
    const t = getOrb().style.transform || '';
    const m = /scale\(([^)]+)\)/.exec(t);
    return m ? parseFloat(m[1]) : 0;
  }

  function getProgressRingOpacity(): string {
    return getProgressRing().classList.contains('opacity-100') ? '100' : '0';
  }

  function getProgressCircleOffset(): number {
    const circle = getProgressCircle();
    return parseFloat(circle.style.strokeDashoffset || '0');
  }

  describe('Initialization', () => {
    it('renders with correct initial state', () => {
      act(() => {
        root.render(
          <BreathingAnimationV3
            pattern={testPattern}
            onRegisterControls={(api) => { controls = api; }}
          />
        );
      });

      expect(getPhaseText().textContent).toBe('in');
      expect(getSecondsCounter()).toBeNull();
      expect(getScale()).toBe(0);
      expect(getProgressRingOpacity()).toBe('0');
    });

    it('registers controls on mount', () => {
      const onRegisterControls = jest.fn();
      
      act(() => {
        root.render(
          <BreathingAnimationV3
            pattern={testPattern}
            onRegisterControls={onRegisterControls}
          />
        );
      });

      expect(onRegisterControls).toHaveBeenCalledWith({
        start: expect.any(Function),
        pause: expect.any(Function),
        reset: expect.any(Function)
      });
    });

    it('calls onStatusChange with idle on mount', () => {
      const onStatusChange = jest.fn();
      
      act(() => {
        root.render(
          <BreathingAnimationV3
            pattern={testPattern}
            onStatusChange={onStatusChange}
          />
        );
      });

      expect(onStatusChange).toHaveBeenCalledWith('idle');
    });
  });

  describe('Animation Lifecycle', () => {
    it('starts animation and shows running state', () => {
      const onStatusChange = jest.fn();
      
      act(() => {
        root.render(
          <BreathingAnimationV3
            pattern={fastPattern}
            onStatusChange={onStatusChange}
            onRegisterControls={(api) => { controls = api; }}
          />
        );
      });

      act(() => { controls!.start(); });
      frame(0);

      expect(onStatusChange).toHaveBeenCalledWith('running');
      expect(getPhaseText().textContent).toBe('in');
      expect(getSecondsCounter()).not.toBeNull();
    });

    it('pauses animation and shows paused state', () => {
      const onStatusChange = jest.fn();
      
      act(() => {
        root.render(
          <BreathingAnimationV3
            pattern={fastPattern}
            onStatusChange={onStatusChange}
            onRegisterControls={(api) => { controls = api; }}
          />
        );
      });

      act(() => { controls!.start(); });
      frame(0);
      act(() => { controls!.pause(); });

      expect(onStatusChange).toHaveBeenCalledWith('paused');
    });

    it('resets animation to initial state', () => {
      const onStatusChange = jest.fn();
      
      act(() => {
        root.render(
          <BreathingAnimationV3
            pattern={fastPattern}
            onStatusChange={onStatusChange}
            onRegisterControls={(api) => { controls = api; }}
          />
        );
      });

      act(() => { controls!.start(); });
      frame(100);
      act(() => { controls!.reset(); });

      expect(onStatusChange).toHaveBeenCalledWith('idle');
      expect(getPhaseText().textContent).toBe('in');
      expect(getSecondsCounter()).toBeNull();
      expect(getScale()).toBe(0);
    });
  });

  describe('Phase Transitions', () => {
    it('transitions through all phases in correct order', () => {
      const onPhaseChange = jest.fn();
      
      act(() => {
        root.render(
          <BreathingAnimationV3
            pattern={fastPattern}
            onPhaseChange={onPhaseChange}
            onRegisterControls={(api) => { controls = api; }}
          />
        );
      });

      act(() => { controls!.start(); });
      frame(0);

      // Inhale phase
      expect(getPhaseText().textContent).toBe('in');
      frame(200); // Complete inhale
      expect(onPhaseChange).toHaveBeenCalledWith('hold_in');

      // Hold in phase
      expect(getPhaseText().textContent).toBe('hold');
      frame(100); // Complete hold_in
      expect(onPhaseChange).toHaveBeenCalledWith('exhale');

      // Exhale phase
      expect(getPhaseText().textContent).toBe('out');
      frame(200); // Complete exhale
      expect(onPhaseChange).toHaveBeenCalledWith('hold_out');

      // Hold out phase
      expect(getPhaseText().textContent).toBe('hold');
      frame(100); // Complete hold_out
      expect(onPhaseChange).toHaveBeenCalledWith('inhale'); // Back to start
    });

    it('cycles back to inhale after hold_out', () => {
      const onPhaseChange = jest.fn();
      
      act(() => {
        root.render(
          <BreathingAnimationV3
            pattern={fastPattern}
            onPhaseChange={onPhaseChange}
            onRegisterControls={(api) => { controls = api; }}
          />
        );
      });

      act(() => { controls!.start(); });
      
      // Complete full cycle
      frame(200); // inhale
      frame(100); // hold_in
      frame(200); // exhale
      frame(100); // hold_out

      expect(onPhaseChange).toHaveBeenLastCalledWith('inhale');
    });
  });

  describe('Visual Animations', () => {
    it('scales orb during inhale phase', () => {
      act(() => {
        root.render(
          <BreathingAnimationV3
            pattern={fastPattern}
            onRegisterControls={(api) => { controls = api; }}
          />
        );
      });

      act(() => { controls!.start(); });
      frame(0);

      // Start of inhale - scale should be 0
      expect(getScale()).toBe(0);

      // Mid inhale - scale should be increasing
      frame(100);
      const midScale = getScale();
      expect(midScale).toBeGreaterThan(0);
      expect(midScale).toBeLessThan(1);

      // End of inhale - scale should be 1
      frame(100);
      expect(getScale()).toBeCloseTo(1, 1);
    });

    it('shows progress ring during hold phases', () => {
      act(() => {
        root.render(
          <BreathingAnimationV3
            pattern={fastPattern}
            onRegisterControls={(api) => { controls = api; }}
          />
        );
      });

      act(() => { controls!.start(); });
      
      // Complete inhale to reach hold_in
      frame(200);
      expect(getProgressRingOpacity()).toBe('100');

      // Complete hold_in to reach exhale
      frame(100);
      expect(getProgressRingOpacity()).toBe('0');

      // Complete exhale to reach hold_out
      frame(200);
      expect(getProgressRingOpacity()).toBe('100');
    });

    it('scales orb down during exhale phase', () => {
      act(() => {
        root.render(
          <BreathingAnimationV3
            pattern={fastPattern}
            onRegisterControls={(api) => { controls = api; }}
          />
        );
      });

      act(() => { controls!.start(); });
      
      // Complete inhale and hold_in to reach exhale
      frame(200); // inhale
      frame(100); // hold_in

      // Start of exhale - scale should be 1
      expect(getScale()).toBeCloseTo(1, 1);

      // Mid exhale - scale should be decreasing
      frame(100);
      const midScale = getScale();
      expect(midScale).toBeLessThan(1);
      expect(midScale).toBeGreaterThan(0);

      // End of exhale - scale should be 0
      frame(100);
      expect(getScale()).toBeCloseTo(0, 1);
    });

    it('maintains scale at 0 during hold_out phase', () => {
      act(() => {
        root.render(
          <BreathingAnimationV3
            pattern={fastPattern}
            onRegisterControls={(api) => { controls = api; }}
          />
        );
      });

      act(() => { controls!.start(); });
      
      // Complete inhale, hold_in, and exhale to reach hold_out
      frame(200); // inhale
      frame(100); // hold_in
      frame(200); // exhale

      // During hold_out - scale should remain 0
      expect(getScale()).toBeCloseTo(0, 1);
      frame(50);
      expect(getScale()).toBeCloseTo(0, 1);
    });
  });

  describe('Progress Ring Animation', () => {
    it('animates progress circle during hold phases', () => {
      act(() => {
        root.render(
          <BreathingAnimationV3
            pattern={fastPattern}
            onRegisterControls={(api) => { controls = api; }}
          />
        );
      });

      act(() => { controls!.start(); });
      
      // Complete inhale to reach hold_in
      frame(200);

      // Start of hold_in - offset should be at circumference (no progress)
      const initialOffset = getProgressCircleOffset();
      expect(initialOffset).toBeGreaterThan(0);

      // Mid hold_in - offset should be decreasing
      frame(50);
      const midOffset = getProgressCircleOffset();
      expect(midOffset).toBeLessThan(initialOffset);

      // End of hold_in - offset should be 0 (full progress)
      frame(50);
      expect(getProgressCircleOffset()).toBeCloseTo(0, 1);
    });
  });

  describe('Cycle Counting', () => {
    it('counts cycles correctly', () => {
      const onCycleComplete = jest.fn();
      
      act(() => {
        root.render(
          <BreathingAnimationV3
            pattern={fastPattern}
            onCycleComplete={onCycleComplete}
            onRegisterControls={(api) => { controls = api; }}
          />
        );
      });

      act(() => { controls!.start(); });
      
      // Complete first cycle
      frame(200); // inhale
      frame(100); // hold_in
      frame(200); // exhale
      frame(100); // hold_out

      expect(onCycleComplete).toHaveBeenCalledWith(1);

      // Complete second cycle
      frame(200); // inhale
      frame(100); // hold_in
      frame(200); // exhale
      frame(100); // hold_out

      expect(onCycleComplete).toHaveBeenCalledWith(2);
    });

    it('resets cycle count on reset', () => {
      const onCycleComplete = jest.fn();
      
      act(() => {
        root.render(
          <BreathingAnimationV3
            pattern={fastPattern}
            onCycleComplete={onCycleComplete}
            onRegisterControls={(api) => { controls = api; }}
          />
        );
      });

      act(() => { controls!.start(); });
      
      // Complete one cycle
      frame(200); // inhale
      frame(100); // hold_in
      frame(200); // exhale
      frame(100); // hold_out

      expect(onCycleComplete).toHaveBeenCalledWith(1);

      // Reset
      act(() => { controls!.reset(); });
      onCycleComplete.mockClear();

      // Start again and complete cycle
      act(() => { controls!.start(); });
      frame(200); // inhale
      frame(100); // hold_in
      frame(200); // exhale
      frame(100); // hold_out

      expect(onCycleComplete).toHaveBeenCalledWith(1); // Should start from 1 again
    });
  });

  describe('Pause and Resume', () => {
    it('freezes animation on pause', () => {
      act(() => {
        root.render(
          <BreathingAnimationV3
            pattern={fastPattern}
            onRegisterControls={(api) => { controls = api; }}
          />
        );
      });

      act(() => { controls!.start(); });
      frame(100); // Mid inhale
      
      const scaleAtPause = getScale();
      act(() => { controls!.pause(); });
      
      // Advance time while paused - scale should remain frozen
      frame(100);
      expect(getScale()).toBeCloseTo(scaleAtPause, 3);
    });

    it('resumes from correct position after pause', () => {
      act(() => {
        root.render(
          <BreathingAnimationV3
            pattern={fastPattern}
            onRegisterControls={(api) => { controls = api; }}
          />
        );
      });

      act(() => { controls!.start(); });
      frame(100); // Mid inhale
      const scaleAtPause = getScale();
      
      act(() => { controls!.pause(); });
      frame(100); // Time passes while paused
      
      act(() => { controls!.start(); }); // Resume
      frame(50); // Continue from where we paused
      
      const scaleAfterResume = getScale();
      expect(scaleAfterResume).toBeGreaterThan(scaleAtPause);
    });
  });

  describe('Seconds Counter', () => {
    it('shows correct remaining seconds', () => {
      act(() => {
        root.render(
          <BreathingAnimationV3
            pattern={testPattern}
            onRegisterControls={(api) => { controls = api; }}
          />
        );
      });

      act(() => { controls!.start(); });
      frame(0);

      // Start of inhale (2 seconds)
      expect(getSecondsCounter()?.textContent).toBe('2s');

      // 1 second into inhale
      frame(1000);
      expect(getSecondsCounter()?.textContent).toBe('1s');

      // End of inhale
      frame(1000);
      expect(getSecondsCounter()?.textContent).toBe('0s');
    });

    it('hides seconds counter when not running', () => {
      act(() => {
        root.render(
          <BreathingAnimationV3
            pattern={testPattern}
            onRegisterControls={(api) => { controls = api; }}
          />
        );
      });

      // Not running - should not show counter
      expect(getSecondsCounter()).toBeNull();

      act(() => { controls!.start(); });
      frame(0);
      expect(getSecondsCounter()).not.toBeNull();

      act(() => { controls!.pause(); });
      expect(getSecondsCounter()).not.toBeNull(); // Should still show when paused

      act(() => { controls!.reset(); });
      expect(getSecondsCounter()).toBeNull(); // Should hide when reset
    });
  });

  describe('Debug Updates', () => {
    it('provides debug information', () => {
      const onDebugUpdate = jest.fn();
      
      act(() => {
        root.render(
          <BreathingAnimationV3
            pattern={fastPattern}
            onDebugUpdate={onDebugUpdate}
            onRegisterControls={(api) => { controls = api; }}
          />
        );
      });

      act(() => { controls!.start(); });
      frame(0);

      expect(onDebugUpdate).toHaveBeenCalledWith({
        phase: 'inhale',
        phaseElapsed: expect.any(Number),
        phaseDuration: 0.2,
        progress: expect.any(Number),
        internalCycle: 0,
        rafActive: true,
        isPaused: false,
        isRunning: true
      });
    });
  });

  describe('Reduced Motion Support', () => {
    it('respects prefers-reduced-motion', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      act(() => {
        root.render(
          <BreathingAnimationV3
            pattern={fastPattern}
            onRegisterControls={(api) => { controls = api; }}
          />
        );
      });

      act(() => { controls!.start(); });
      frame(100); // Mid inhale

      // With reduced motion, scale should be 1 during inhale (no animation)
      expect(getScale()).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('handles missing DOM elements gracefully', () => {
      act(() => {
        root.render(
          <BreathingAnimationV3
            pattern={fastPattern}
            onRegisterControls={(api) => { controls = api; }}
          />
        );
      });

      // Remove the orb element to simulate missing DOM
      const orb = getOrb();
      orb.remove();

      // Should not throw when trying to animate
      expect(() => {
        act(() => { controls!.start(); });
        frame(100);
      }).not.toThrow();
    });
  });

  describe('Watchdog Timer', () => {
    it('recovers from stalled animation frames', () => {
      act(() => {
        root.render(
          <BreathingAnimationV3
            pattern={fastPattern}
            onRegisterControls={(api) => { controls = api; }}
          />
        );
      });

      act(() => { controls!.start(); });
      frame(0);

      // Simulate RAF stall by clearing the callback
      rafCb = null;

      // Advance time beyond watchdog threshold (250ms)
      frame(300);

      // Watchdog should have restarted RAF
      expect(rafCb).not.toBeNull();
    });
  });
});
