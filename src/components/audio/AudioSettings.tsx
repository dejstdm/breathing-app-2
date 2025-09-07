"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { Volume2, VolumeX, Play, Bell, MessageCircle, Waves } from 'lucide-react';
import { AudioSettings, useAudioCues } from '@/hooks/useAudioCues';

interface AudioSettingsComponentProps {
  settings: AudioSettings;
  onSettingsChange: (settings: AudioSettings) => void;
}

const STORAGE_KEY = 'breathing-app-audio-settings';

export default function AudioSettingsComponent({ 
  settings, 
  onSettingsChange 
}: AudioSettingsComponentProps) {
  const [localSettings, setLocalSettings] = useState<AudioSettings>(settings);
  const [isTesting, setIsTesting] = useState(false);
  
  const { 
    playPhaseStart, 
    playTransition, 
    playSessionStart, 
    isLoading, 
    isSupported, 
    error 
  } = useAudioCues(localSettings);

  // Update local settings when props change
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Save settings and notify parent
  const updateSettings = useCallback((newSettings: Partial<AudioSettings>) => {
    const updatedSettings = { ...localSettings, ...newSettings };
    setLocalSettings(updatedSettings);
    onSettingsChange(updatedSettings);
    
    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
    } catch (err) {
      console.warn('Failed to save audio settings:', err);
    }
  }, [localSettings, onSettingsChange]);

  // Test audio function
  const testAudio = useCallback(async (phase?: 'inhale' | 'hold_in' | 'exhale' | 'hold_out') => {
    if (!localSettings.enabled || isTesting) return;
    
    setIsTesting(true);
    try {
      if (phase) {
        await playPhaseStart(phase);
      } else {
        // Test sequence
        await playSessionStart();
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const phases: Array<'inhale' | 'hold_in' | 'exhale' | 'hold_out'> = 
          ['inhale', 'hold_in', 'exhale', 'hold_out'];
        
        for (const p of phases) {
          await playPhaseStart(p);
          await new Promise(resolve => setTimeout(resolve, 600));
        }
        
        if (localSettings.transitionSounds) {
          await playTransition();
        }
      }
    } catch (err) {
      console.error('Audio test failed:', err);
    } finally {
      setIsTesting(false);
    }
  }, [localSettings, isTesting, playPhaseStart, playSessionStart, playTransition]);

  if (!isSupported) {
    return (
      <div className="audio-settings p-4 text-center">
        <VolumeX className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-semibold mb-2">Audio Not Supported</h3>
        <p className="text-sm text-muted-foreground">
          Audio playback is not available in this browser or device.
        </p>
      </div>
    );
  }

  return (
    <div className="audio-settings space-y-6">
      {/* Enable/Disable Audio */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Volume2 className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold">Audio Guidance</h3>
            <p className="text-sm text-muted-foreground">
              Enable audio cues during breathing sessions
            </p>
          </div>
        </div>
        <Toggle
          pressed={localSettings.enabled}
          onPressedChange={(enabled) => updateSettings({ enabled })}
          aria-label="Enable audio guidance"
        >
          {localSettings.enabled ? 'On' : 'Off'}
        </Toggle>
      </div>

      {localSettings.enabled && (
        <>
          <Separator />

          {/* Volume Control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-medium">Volume</label>
              <span className="text-sm text-muted-foreground">
                {Math.round(localSettings.volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={localSettings.volume}
              onChange={(e) => updateSettings({ volume: parseFloat(e.target.value) })}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          <Separator />

          {/* Voice Type Selection */}
          <div className="space-y-3">
            <label className="font-medium flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Voice Type
            </label>
            <ToggleGroup
              type="single"
              value={localSettings.voiceType}
              onValueChange={(value) => value && updateSettings({ voiceType: value as 'bell' | 'chime' | 'voice' | 'tone' })}
              className="grid grid-cols-2 gap-2"
            >
              <ToggleGroupItem value="chime" className="flex flex-col gap-1 h-auto py-3">
                <Bell className="w-4 h-4" />
                <span className="text-xs">Chime</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="bell" className="flex flex-col gap-1 h-auto py-3">
                <Volume2 className="w-4 h-4" />
                <span className="text-xs">Bell</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="tone" className="flex flex-col gap-1 h-auto py-3">
                <Waves className="w-4 h-4" />
                <span className="text-xs">Tone</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="voice" className="flex flex-col gap-1 h-auto py-3">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs">Voice</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <Separator />

          {/* Audio Options */}
          <div className="space-y-4">
            <h4 className="font-medium">Audio Options</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Phase Announcements</div>
                <div className="text-xs text-muted-foreground">
                  Play sounds for &ldquo;breathe in&rdquo;, &ldquo;hold&rdquo;, &ldquo;breathe out&rdquo;
                </div>
              </div>
              <Toggle
                pressed={localSettings.phaseAnnouncements}
                onPressedChange={(phaseAnnouncements) => 
                  updateSettings({ phaseAnnouncements })
                }
                size="sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Transition Sounds</div>
                <div className="text-xs text-muted-foreground">
                  Gentle sounds between breathing phases
                </div>
              </div>
              <Toggle
                pressed={localSettings.transitionSounds}
                onPressedChange={(transitionSounds) => 
                  updateSettings({ transitionSounds })
                }
                size="sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Background Ambient</div>
                <div className="text-xs text-muted-foreground">
                  Subtle background sounds during sessions
                </div>
              </div>
              <Toggle
                pressed={localSettings.backgroundAmbient}
                onPressedChange={(backgroundAmbient) => 
                  updateSettings({ backgroundAmbient })
                }
                size="sm"
                disabled // Future feature
              />
            </div>
          </div>

          <Separator />

          {/* Test Audio */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <Play className="w-4 h-4" />
                Test Audio
              </h4>
              {isLoading && (
                <div className="text-xs text-muted-foreground">Loading...</div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => testAudio('inhale')}
                disabled={isTesting || isLoading}
                className="text-xs"
              >
                Breathe In
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testAudio('hold_in')}
                disabled={isTesting || isLoading}
                className="text-xs"
              >
                Hold In
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testAudio('exhale')}
                disabled={isTesting || isLoading}
                className="text-xs"
              >
                Breathe Out
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testAudio('hold_out')}
                disabled={isTesting || isLoading}
                className="text-xs"
              >
                Hold Out
              </Button>
            </div>
            
            <Button
              variant="secondary"
              onClick={() => testAudio()}
              disabled={isTesting || isLoading}
              className="w-full"
            >
              {isTesting ? 'Testing...' : 'Test Full Sequence'}
            </Button>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              <strong>Audio Error:</strong> {error}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Hook to load audio settings from localStorage
export function useAudioSettings(): [AudioSettings, (settings: AudioSettings) => void] {
  const [settings, setSettings] = useState<AudioSettings>({
    enabled: false,
    volume: 0.7,
    voiceType: 'chime',
    phaseAnnouncements: true,
    transitionSounds: true,
    backgroundAmbient: false,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (err) {
      console.warn('Failed to load audio settings:', err);
    }
  }, []);

  const updateSettings = useCallback((newSettings: AudioSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (err) {
      console.warn('Failed to save audio settings:', err);
    }
  }, []);

  return [settings, updateSettings];
}