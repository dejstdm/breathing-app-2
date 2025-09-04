"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type HeaderState = {
  title?: string | null;
  infoItems?: string[] | null;
};

type HeaderContextValue = HeaderState & {
  setHeader: (next: HeaderState) => void;
  resetHeader: () => void;
};

const HeaderContext = createContext<HeaderContextValue | null>(null);

export function HeaderProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<HeaderState>({ title: null, infoItems: null });

  const setHeader = useCallback((next: HeaderState) => {
    setState({ title: next.title ?? null, infoItems: next.infoItems ?? null });
  }, []);

  const resetHeader = useCallback(() => setState({ title: null, infoItems: null }), []);

  const value = useMemo(
    () => ({ ...state, setHeader, resetHeader }),
    [state, setHeader, resetHeader]
  );

  return <HeaderContext.Provider value={value}>{children}</HeaderContext.Provider>;
}

export function useHeader() {
  const ctx = useContext(HeaderContext);
  if (!ctx) throw new Error("useHeader must be used within HeaderProvider");
  return ctx;
}

