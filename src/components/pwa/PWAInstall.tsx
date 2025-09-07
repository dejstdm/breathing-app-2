"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, Smartphone, Monitor, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

interface PWAInstallProps {
  variant?: 'button' | 'banner' | 'minimal';
  showStatus?: boolean;
}

export default function PWAInstall({ variant = 'button', showStatus = true }: PWAInstallProps) {
  const [isInstalling, setIsInstalling] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const { 
    isInstallable, 
    isInstalled, 
    isOffline, 
    hasUpdate, 
    isRegistered,
    install, 
    skipWaiting
  } = usePWA();

  const handleInstall = async () => {
    if (!isInstallable) return;
    
    setIsInstalling(true);
    try {
      await install();
      setShowDialog(false);
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleUpdate = () => {
    skipWaiting();
  };

  if (isInstalled && !hasUpdate && variant !== 'minimal') {
    return null;
  }

  // Status indicators
  const StatusIndicators = () => {
    if (!showStatus) return null;
    
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {isOffline ? (
          <div className="flex items-center gap-1">
            <WifiOff className="w-3 h-3" />
            <span>Offline</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Wifi className="w-3 h-3" />
            <span>Online</span>
          </div>
        )}
        
        {isRegistered && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>PWA Ready</span>
          </div>
        )}
        
        {hasUpdate && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleUpdate}
            className="h-6 px-2 text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Update
          </Button>
        )}
      </div>
    );
  };

  // Banner variant
  if (variant === 'banner' && isInstallable) {
    return (
      <div className="pwa-install-banner bg-primary/10 border border-primary/20 rounded-lg p-4 m-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Install Breathing App</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Get the full app experience with offline access and quick launch from your home screen.
            </p>
            <StatusIndicators />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleInstall} disabled={isInstalling}>
              {isInstalling ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Minimal variant - just status
  if (variant === 'minimal') {
    return (
      <div className="pwa-status flex items-center gap-2">
        <StatusIndicators />
      </div>
    );
  }

  // Button variant with dialog
  return (
    <div className="pwa-install">
      {(isInstallable || hasUpdate) && (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button 
              variant={hasUpdate ? "default" : "outline"} 
              size="sm"
              className="pwa-install-button"
            >
              {hasUpdate ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Update Available
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Install App
                </>
              )}
            </Button>
          </DialogTrigger>
          
          <DialogContent className="pwa-install-dialog max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                {hasUpdate ? 'Update Available' : 'Install Breathing App'}
              </DialogTitle>
              <DialogDescription>
                {hasUpdate ? (
                  'A new version of the app is available with improvements and bug fixes.'
                ) : (
                  'Install the Breathing App for the best experience with offline access and quick launch.'
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {!hasUpdate && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col items-center p-3 border rounded-lg">
                    <Monitor className="w-8 h-8 mb-2 text-primary" />
                    <span className="font-medium">Desktop</span>
                    <span className="text-muted-foreground text-center">Add to desktop for quick access</span>
                  </div>
                  <div className="flex flex-col items-center p-3 border rounded-lg">
                    <Smartphone className="w-8 h-8 mb-2 text-primary" />
                    <span className="font-medium">Mobile</span>
                    <span className="text-muted-foreground text-center">Add to home screen like a native app</span>
                  </div>
                </div>
              )}
              
              <div className="bg-muted/50 rounded-lg p-3">
                <h4 className="font-medium text-sm mb-2">Benefits:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Works completely offline</li>
                  <li>• Faster loading and smoother performance</li>
                  <li>• Quick access from home screen/desktop</li>
                  <li>• Full-screen experience without browser UI</li>
                </ul>
              </div>

              <StatusIndicators />
              
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDialog(false)}
                  className="flex-1"
                >
                  Not Now
                </Button>
                <Button 
                  onClick={hasUpdate ? handleUpdate : handleInstall}
                  disabled={isInstalling}
                  className="flex-1"
                >
                  {isInstalling ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : hasUpdate ? (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {hasUpdate ? 'Update Now' : 'Install'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Utility component for PWA status display
export function PWAStatus() {
  return <PWAInstall variant="minimal" />;
}

// Utility component for install banner
export function PWABanner() {
  return <PWAInstall variant="banner" />;
}