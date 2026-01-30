import { useCallback, useMemo, useEffect, useState } from 'react';

export type SoundKey = 
  | 'task_done' 
  | 'habit_done' 
  | 'goal_progress' 
  | 'alert' 
  | 'ai_insight';

interface SoundSettings {
  enabled: boolean;
  volume: number;
}

const STORAGE_KEY = 'second-brain-sound-settings';

const defaultSettings: SoundSettings = {
  enabled: true,
  volume: 0.5,
};

export function useSoundSettings() {
  const [settings, setSettings] = useState<SoundSettings>(() => {
    if (typeof window === 'undefined') return defaultSettings;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage errors
    }
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<SoundSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  return { settings, updateSettings };
}

export function useSound() {
  const { settings } = useSoundSettings();
  
  const ctx = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    return AudioCtx ? new AudioCtx() : null;
  }, []);

  const play = useCallback((key: SoundKey) => {
    if (!settings.enabled || !ctx) return;
    
    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();

    // Subtle, calming presets for each sound type
    const presets: Record<SoundKey, { f: number; t: number; type: OscillatorType; ramp?: number }> = {
      task_done: { f: 880, t: 0.08, type: 'sine', ramp: 1.5 },      // Soft chime
      habit_done: { f: 740, t: 0.06, type: 'sine', ramp: 1.3 },     // Gentle bell
      goal_progress: { f: 520, t: 0.12, type: 'triangle', ramp: 1.6 }, // Rising tone
      alert: { f: 220, t: 0.15, type: 'sine' },                     // Low pulse
      ai_insight: { f: 440, t: 0.1, type: 'triangle', ramp: 1.2 },  // Subtle tone
    };

    const p = presets[key];
    o.type = p.type;
    o.frequency.setValueAtTime(p.f, now);
    
    // Add frequency ramp for rising tones
    if (p.ramp) {
      o.frequency.exponentialRampToValueAtTime(p.f * p.ramp, now + p.t * 0.8);
    }

    // Volume envelope - subtle but audible
    const maxVolume = Math.max(0.001, settings.volume * 0.08);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(maxVolume, now + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, now + p.t);

    o.connect(g);
    g.connect(ctx.destination);
    o.start(now);
    o.stop(now + p.t + 0.02);
  }, [settings.enabled, settings.volume, ctx]);

  // Convenience methods
  const playTaskDone = useCallback(() => play('task_done'), [play]);
  const playHabitDone = useCallback(() => play('habit_done'), [play]);
  const playGoalProgress = useCallback(() => play('goal_progress'), [play]);
  const playAlert = useCallback(() => play('alert'), [play]);
  const playAIInsight = useCallback(() => play('ai_insight'), [play]);

  return { 
    play, 
    playTaskDone, 
    playHabitDone, 
    playGoalProgress, 
    playAlert, 
    playAIInsight,
    enabled: settings.enabled,
    volume: settings.volume,
  };
}
