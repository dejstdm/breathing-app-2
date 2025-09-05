/** @jest-environment jsdom */
import React, { act } from 'react';
import ReactDOM from 'react-dom/client';
import BreathingAnimationV3 from '@/components/breathing/BreathingAnimationV3';
import type { BreathingPattern } from '@/types/breathing';

describe('BreathingAnimationV3 Debug', () => {
  let container: HTMLDivElement;
  let root: ReactDOM.Root;

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
  });

  it('renders component and finds DOM elements', () => {
    act(() => {
      root.render(
        <BreathingAnimationV3
          pattern={fastPattern}
        />
      );
    });

    // Check if the component renders
    expect(container.innerHTML).toContain('breathing-v3__animation-container');
    
    // Check for specific elements
    const orb = container.querySelector('.breathing-v3__orb');
    const progressRing = container.querySelector('.breathing-v3__progress-ring');
    const phaseText = container.querySelector('.breathing-v3__phase-text');
    
    expect(orb).toBeTruthy();
    expect(progressRing).toBeTruthy();
    expect(phaseText).toBeTruthy();
    
    // Check initial state
    expect(phaseText?.textContent).toBe('in');
  });

  it('renders with controls', () => {
    let controls: { start: () => void; pause: () => void; reset: () => void } | null = null;
    
    act(() => {
      root.render(
        <BreathingAnimationV3
          pattern={fastPattern}
          onRegisterControls={(api) => { controls = api; }}
        />
      );
    });

    expect(controls).toBeTruthy();
    expect(typeof controls!.start).toBe('function');
    expect(typeof controls!.pause).toBe('function');
    expect(typeof controls!.reset).toBe('function');
  });
});
