/** @jest-environment jsdom */
import React, { act } from 'react';
import ReactDOM from 'react-dom/client';
import BreathingAnimationV3 from '@/components/breathing/BreathingAnimationV3';
import type { BreathingPattern } from '@/types/breathing';

describe('BreathingAnimationV3 pause/resume', () => {
  let container: HTMLDivElement;
  let root: ReactDOM.Root;
  let now = 0;
  let rafCb: FrameRequestCallback | null = null;
  let controls: { start: () => void; pause: () => void; reset: () => void } | null = null;

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
    // drive a single frame
    if (rafCb) rafCb(now);
  }

  function getOrb(): HTMLElement {
    const el = container.querySelector('.breathing-v3__orb') as HTMLElement;
    if (!el) throw new Error('orb not found');
    return el;
  }

  function getScale(): number {
    const t = getOrb().style.transform || '';
    const m = /scale\(([^)]+)\)/.exec(t);
    return m ? parseFloat(m[1]) : 0;
  }

  it('freezes on pause mid-inhale and resumes from the same progress', () => {
    const pattern: BreathingPattern = { inhale: 0.2, hold_in: 0, exhale: 0.2, hold_out: 0 };
    act(() => {
      root.render(
        <BreathingAnimationV3
          pattern={pattern}
          onRegisterControls={(api) => { controls = api; }}
        />
      );
    });

    // Start
    act(() => { controls!.start(); });
    // First frame
    frame(0);

    // Advance 100ms into inhale (50%) then pause
    frame(100);
    const scaleAtPause = getScale();
    expect(scaleAtPause).toBeGreaterThan(0.45);
    expect(scaleAtPause).toBeLessThan(0.55);

    act(() => { controls!.pause(); });

    // Advance time while paused: scale should remain frozen
    frame(100); // do one frame call; component should not schedule further frames when paused
    const frozen = getScale();
    expect(frozen).toBeCloseTo(scaleAtPause, 3);

    // Resume and advance 50ms: scale should be ~0.75 (continue inhale)
    act(() => { controls!.start(); });
    frame(50);
    const afterResume = getScale();
    expect(afterResume).toBeGreaterThan(scaleAtPause);
    expect(afterResume).toBeLessThan(1);

    // Finish inhale (another ~60ms) -> at end of inhale scale should approach 1
    frame(60);
    const endInhale = getScale();
    expect(endInhale).toBeGreaterThan(0.95);

    // Exhale should start and decrease scale towards 0
    frame(50); // into exhale
    const exhaleMid = getScale();
    expect(exhaleMid).toBeLessThan(endInhale);
    frame(150); // finish exhale
    const endExhale = getScale();
    expect(endExhale).toBeLessThan(0.1);
  });
});
