"use client";

import { useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const { isRegistered, checkForUpdate } = usePWA();

  useEffect(() => {
    // Check for updates every 30 minutes when the app is active
    if (isRegistered) {
      const interval = setInterval(() => {
        checkForUpdate();
      }, 30 * 60 * 1000); // 30 minutes

      return () => clearInterval(interval);
    }
  }, [isRegistered, checkForUpdate]);

  // Check for updates when the app becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isRegistered) {
        checkForUpdate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRegistered, checkForUpdate]);

  return <>{children}</>;
}