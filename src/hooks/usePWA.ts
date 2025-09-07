import { useEffect, useState } from 'react';

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  hasUpdate: boolean;
  isRegistered: boolean;
}

interface PWAActions {
  install: () => Promise<void>;
  skipWaiting: () => void;
  checkForUpdate: () => Promise<void>;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWA(): PWAState & PWAActions {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Register service worker
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Only register service worker in production or when explicitly testing PWA
      const isDev = process.env.NODE_ENV === 'development';
      const testPWA = process.env.NEXT_PUBLIC_TEST_PWA === 'true';
      
      if (!isDev || testPWA) {
        registerServiceWorker();
      } else {
        console.log('[PWA] Service worker registration skipped in development mode');
        console.log('[PWA] To test PWA functionality in development:');
        console.log('[PWA] 1. Set NEXT_PUBLIC_TEST_PWA=true in .env.local');
        console.log('[PWA] 2. Or run: npm run build && npm run start');
        console.log('[PWA] 3. Or test in production deployment');
      }
    }
  }, []);

  // Check if app is installed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkInstallation = () => {
        // Check if running in standalone mode
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        // Check if running in web app capable mode (iOS)
        const isWebAppCapable = ('standalone' in window.navigator) && (window.navigator as { standalone?: boolean }).standalone === true;
        
        setIsInstalled(isStandalone || isWebAppCapable);
      };

      checkInstallation();
      
      // Listen for display mode changes
      const mediaQuery = window.matchMedia('(display-mode: standalone)');
      const handleChange = () => checkInstallation();
      
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }
    }
  }, []);

  // Listen for online/offline status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateOnlineStatus = () => {
        setIsOffline(!navigator.onLine);
      };

      updateOnlineStatus();
      
      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);
      
      return () => {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
      };
    }
  }, []);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        const promptEvent = e as BeforeInstallPromptEvent;
        setDeferredPrompt(promptEvent);
        setIsInstallable(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  // Listen for app install event
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleAppInstalled = () => {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        
        // Track installation event (if analytics is available)
        if (typeof window !== 'undefined' && 'gtag' in window) {
          (window as { gtag: (...args: unknown[]) => void }).gtag('event', 'app_install', {
            method: 'pwa_prompt'
          });
        }
        
        console.log('[PWA] App was installed successfully');
      };

      window.addEventListener('appinstalled', handleAppInstalled);
      
      return () => {
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      // Check if service worker file is accessible first
      const swResponse = await fetch('/sw.js');
      if (!swResponse.ok) {
        console.warn(`[PWA] Service worker file not accessible: ${swResponse.status} ${swResponse.statusText}`);
        // In development, this might be expected
        if (process.env.NODE_ENV === 'development') {
          console.log('[PWA] This is normal in development mode');
          return;
        }
        throw new Error(`Service worker file not accessible: ${swResponse.status} ${swResponse.statusText}`);
      }
      
      // Register with additional options for better compatibility
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Ensure fresh service worker updates
      });

      setRegistration(reg);
      setIsRegistered(true);

      console.log('[PWA] Service worker registered successfully');

      // Check for updates
      if (reg.waiting) {
        setHasUpdate(true);
      }

      // Listen for new service worker
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setHasUpdate(true);
            }
          });
        }
      });

      // Listen for controlling service worker change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] Service worker updated, reloading...');
        window.location.reload();
      });

    } catch (error) {
      console.error('[PWA] Service worker registration failed:', error);
      // Don't throw the error to prevent breaking the app
      setIsRegistered(false);
    }
  };

  const install = async (): Promise<void> => {
    if (!deferredPrompt) {
      throw new Error('Install prompt not available');
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      console.log('[PWA] User choice:', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
      } else {
        console.log('[PWA] User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('[PWA] Error during installation:', error);
      throw error;
    }
  };

  const skipWaiting = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  const checkForUpdate = async (): Promise<void> => {
    if (registration) {
      try {
        await registration.update();
        console.log('[PWA] Checked for updates');
      } catch (error) {
        console.error('[PWA] Error checking for updates:', error);
      }
    }
  };

  return {
    // State
    isInstallable,
    isInstalled,
    isOffline,
    hasUpdate,
    isRegistered,
    
    // Actions
    install,
    skipWaiting,
    checkForUpdate
  };
}

export default usePWA;