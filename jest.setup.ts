// Setup file for Jest. Extend here as needed.

// Ensure requestAnimationFrame is defined for jsdom tests
if (!(global as any).requestAnimationFrame) {
  (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now() as unknown as DOMHighResTimeStamp), 0) as unknown as number;
}
if (!(global as any).cancelAnimationFrame) {
  (global as any).cancelAnimationFrame = (id: number) => clearTimeout(id as unknown as NodeJS.Timeout);
}

// Tell React that our environment supports act(), silencing noisy warnings in tests
// See: https://react.dev/reference/react/act#fixing-act-warnings
(global as any).IS_REACT_ACT_ENVIRONMENT = true;

export {};
