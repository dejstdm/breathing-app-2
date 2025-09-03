/** @jest-environment jsdom */
import React, { act } from 'react';
import ReactDOM from 'react-dom/client';
import { useBreathingCycle } from '@/hooks/useBreathingCycle';
import type { BreathingPattern, BreathingPhase } from '@/types/breathing';

function Harness({ pattern, onPhase, isActive = true }: { pattern: BreathingPattern; onPhase: (p: BreathingPhase) => void; isActive?: boolean }) {
  const { currentPhase, cycle, phaseProgress } = useBreathingCycle(pattern, isActive, { onPhase });
  return <div data-phase={currentPhase} data-cycle={cycle} data-progress={phaseProgress} />;
}

describe('useBreathingCycle timing', () => {
  let container: HTMLDivElement;
  let root: ReactDOM.Root;
  let now = 0;

  beforeEach(() => {
    jest.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = ReactDOM.createRoot(container);
    // Control time
    now = 0;
    jest.spyOn(performance, 'now').mockImplementation(() => now);
    // Make RAF immediate (timestamp param mirrors performance.now)
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(((cb: FrameRequestCallback) => {
      cb(now);
      return 1 as unknown as number;
    }) as typeof window.requestAnimationFrame);
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  function advance(ms: number) {
    now += ms;
    jest.advanceTimersByTime(ms);
  }

  it('advances phases in order and skips 0s holds immediately', () => {
    const events: BreathingPhase[] = [];
    const pattern: BreathingPattern = { inhale: 0.2, hold_in: 0, exhale: 0.2, hold_out: 0 };

    act(() => {
      root.render(<Harness pattern={pattern} onPhase={(p) => events.push(p)} />);
    });

    // Initially in inhale. After 200ms, should move to hold_in (0s) then immediately to exhale
    act(() => {
      advance(200);
    });
    expect(events[0]).toBe('hold_in');
    expect(events[1]).toBe('exhale');

    // After another 200ms, exhale completes -> hold_out(0) -> inhale
    act(() => {
      advance(200);
    });
    expect(events[2]).toBe('hold_out');
    expect(events[3]).toBe('inhale');
  });

  it('increments cycle on returning to inhale', () => {
    const pattern: BreathingPattern = { inhale: 0.15, hold_in: 0, exhale: 0.15, hold_out: 0 };
    act(() => {
      root.render(<Harness pattern={pattern} onPhase={() => {}} />);
    });

    const getCycle = () => Number((container.firstChild as HTMLElement).getAttribute('data-cycle'));
    expect(getCycle()).toBe(0);

    // Complete inhale (150ms) -> hold_in (0) -> exhale (150ms) -> hold_out (0) -> inhale (cycle increments)
    act(() => {
      advance(150); // -> hold_in -> exhale
      advance(150); // -> hold_out -> inhale
    });
    expect(getCycle()).toBe(1);
  });

  it('respects non-zero holds (no skip) with correct ordering', () => {
    const events: BreathingPhase[] = [];
    const pattern: BreathingPattern = { inhale: 0.2, hold_in: 0.1, exhale: 0.2, hold_out: 0.05 };

    act(() => {
      root.render(<Harness pattern={pattern} onPhase={(p) => events.push(p)} />);
    });

    // Finish inhale -> enter hold_in (0.1s)
    act(() => {
      advance(200);
    });
    expect(events[0]).toBe('hold_in');

    // Halfway through hold_in, should still be in hold_in (no exhale yet)
    act(() => {
      advance(60);
    });
    expect(events).toHaveLength(1);

    // Complete hold_in -> exhale
    act(() => {
      advance(40);
    });
    expect(events[1]).toBe('exhale');

    // Finish exhale -> hold_out (0.05s)
    act(() => {
      advance(200);
    });
    expect(events[2]).toBe('hold_out');

    // Complete hold_out -> inhale
    act(() => {
      advance(50);
    });
    expect(events[3]).toBe('inhale');
  });

  it('updates phaseProgress during non-zero hold and resets on phase change', () => {
    const pattern: BreathingPattern = { inhale: 0.05, hold_in: 0.1, exhale: 0.05, hold_out: 0 };
    act(() => {
      root.render(<Harness pattern={pattern} onPhase={() => {}} />);
    });

    const getPhase = () => String((container.firstChild as HTMLElement).getAttribute('data-phase')) as BreathingPhase;
    const getProgress = () => Number((container.firstChild as HTMLElement).getAttribute('data-progress'));

    // Enter hold_in
    act(() => { advance(50); });
    expect(getPhase()).toBe('hold_in');
    expect(getProgress()).toBe(0);

    // Mid hold_in: progress should start increasing (>0 but <1)
    act(() => { advance(60); });
    const mid = getProgress();
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);

    // Complete hold_in -> exhale; progress resets to ~0
    act(() => { advance(40); });
    expect(getPhase()).toBe('exhale');
    expect(getProgress()).toBe(0);

    // Progress should increase again within exhale
    act(() => { advance(30); });
    expect(getProgress()).toBeGreaterThan(0);
  });
});
