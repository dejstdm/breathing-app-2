"use client";

import { useEffect, useState, useCallback, useRef } from 'react';

export interface AudioSettings {
  enabled: boolean;
  volume: number; // 0-1
  voiceType: 'bell' | 'chime' | 'voice' | 'tone';
  phaseAnnouncements: boolean; // "breathe in", "hold", etc.
  transitionSounds: boolean; // gentle sounds between phases
  backgroundAmbient: boolean; // optional ambient sounds
}

export interface AudioCues {
  playPhaseStart: (phase: 'inhale' | 'hold_in' | 'exhale' | 'hold_out') => Promise<void>;
  playTransition: () => Promise<void>;
  playSessionStart: () => Promise<void>;
  playSessionEnd: () => Promise<void>;
  setVolume: (volume: number) => void;
  isLoading: boolean;
  isSupported: boolean;
  error: string | null;
}

interface AudioFileMap {
  [key: string]: HTMLAudioElement;
}

const DEFAULT_SETTINGS: AudioSettings = {
  enabled: false,
  volume: 0.7,
  voiceType: 'chime',
  phaseAnnouncements: true,
  transitionSounds: true,
  backgroundAmbient: false,
};

export function useAudioCues(settings?: Partial<AudioSettings>): AudioCues {
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const audioSettings = { ...DEFAULT_SETTINGS, ...settings };
  const audioCache = useRef<AudioFileMap>({});
  const isInitialized = useRef(false);
  
  // Check audio support
  useEffect(() => {
    const checkSupport = () => {
      try {
        const audio = new Audio();
        const canPlayMP3 = audio.canPlayType('audio/mpeg') !== '';
        const canPlayOGG = audio.canPlayType('audio/ogg') !== '';
        const canPlayWAV = audio.canPlayType('audio/wav') !== '';
        
        if (!canPlayMP3 && !canPlayOGG && !canPlayWAV) {
          setIsSupported(false);
          setError('Audio playback not supported in this browser');
        }
      } catch {
        setIsSupported(false);
        setError('Audio system not available');
      }
    };
    
    checkSupport();
  }, []);

  // Initialize audio files
  const initializeAudio = useCallback(async () => {
    if (!isSupported || !audioSettings.enabled || isInitialized.current) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const audioFiles = [
        // Phase announcement files
        'audio/breathe-in.wav',
        'audio/hold.wav', 
        'audio/breathe-out.wav',
        'audio/hold-out.wav',
        
        // Transition and session sounds
        'audio/transition.wav',
        'audio/session-start.wav',
        'audio/session-end.wav',
        
        // Different voice types
        `audio/${audioSettings.voiceType}/breathe-in.wav`,
        `audio/${audioSettings.voiceType}/hold.wav`,
        `audio/${audioSettings.voiceType}/breathe-out.wav`,
        `audio/${audioSettings.voiceType}/transition.wav`,
      ];

      const loadPromises = audioFiles.map(async (src) => {
        try {
          const audio = new Audio(src);
          audio.volume = audioSettings.volume;
          audio.preload = 'auto';
          
          // Return a promise that resolves when audio can play
          return new Promise<void>((resolve) => {
            const handleCanPlay = () => {
              audioCache.current[src] = audio;
              resolve();
            };
            
            const handleError = () => {
              // Don't reject for individual files - use fallback
              console.warn(`Failed to load audio: ${src}`);
              resolve();
            };

            audio.addEventListener('canplaythrough', handleCanPlay, { once: true });
            audio.addEventListener('error', handleError, { once: true });
            
            // Timeout for slow connections
            setTimeout(() => {
              if (!audioCache.current[src]) {
                console.warn(`Timeout loading audio: ${src}`);
                resolve();
              }
            }, 5000);
          });
        } catch (err) {
          console.warn(`Error creating audio for ${src}:`, err);
          return Promise.resolve();
        }
      });

      await Promise.all(loadPromises);
      isInitialized.current = true;
      
    } catch (err) {
      console.error('Audio initialization failed:', err);
      setError('Failed to load audio files');
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, audioSettings.enabled, audioSettings.volume, audioSettings.voiceType]);

  // Initialize when settings change
  useEffect(() => {
    if (audioSettings.enabled) {
      initializeAudio();
    }
  }, [audioSettings.enabled, initializeAudio]);

  // Play audio with fallback handling
  const playAudio = useCallback(async (src: string): Promise<void> => {
    if (!audioSettings.enabled || !isSupported) {
      return;
    }

    try {
      const audio = audioCache.current[src];
      if (audio) {
        audio.currentTime = 0;
        audio.volume = audioSettings.volume;
        await audio.play();
      } else {
        // Fallback: try to play directly if not cached
        const fallbackAudio = new Audio(src);
        fallbackAudio.volume = audioSettings.volume;
        await fallbackAudio.play();
      }
    } catch (err) {
      console.warn(`Failed to play audio ${src}:`, err);
      // Don't throw - audio failures shouldn't break the breathing session
    }
  }, [audioSettings.enabled, audioSettings.volume, isSupported]);

  // Audio cue functions
  const playPhaseStart = useCallback(async (phase: 'inhale' | 'hold_in' | 'exhale' | 'hold_out'): Promise<void> => {
    if (!audioSettings.phaseAnnouncements) return;

    const phaseMap = {
      'inhale': 'breathe-in.wav',
      'hold_in': 'hold.wav',
      'exhale': 'breathe-out.wav',
      'hold_out': 'hold-out.wav',
    };

    const fileName = phaseMap[phase];
    const primarySrc = `audio/${audioSettings.voiceType}/${fileName}`;
    const fallbackSrc = `audio/${fileName}`;

    // Try voice-specific file first, then fallback to default
    try {
      await playAudio(primarySrc);
    } catch {
      await playAudio(fallbackSrc);
    }
  }, [audioSettings.phaseAnnouncements, audioSettings.voiceType, playAudio]);

  const playTransition = useCallback(async (): Promise<void> => {
    if (!audioSettings.transitionSounds) return;
    
    const primarySrc = `audio/${audioSettings.voiceType}/transition.wav`;
    const fallbackSrc = 'audio/transition.wav';

    try {
      await playAudio(primarySrc);
    } catch {
      await playAudio(fallbackSrc);
    }
  }, [audioSettings.transitionSounds, audioSettings.voiceType, playAudio]);

  const playSessionStart = useCallback(async (): Promise<void> => {
    await playAudio('audio/session-start.wav');
  }, [playAudio]);

  const playSessionEnd = useCallback(async (): Promise<void> => {
    await playAudio('audio/session-end.wav');
  }, [playAudio]);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    // Update all cached audio elements
    Object.values(audioCache.current).forEach(audio => {
      audio.volume = clampedVolume;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(audioCache.current).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      audioCache.current = {};
      isInitialized.current = false;
    };
  }, []);

  return {
    playPhaseStart,
    playTransition,
    playSessionStart,
    playSessionEnd,
    setVolume,
    isLoading,
    isSupported,
    error,
  };
}

export default useAudioCues;