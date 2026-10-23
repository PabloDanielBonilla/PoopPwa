// Web Push & In-App Notification System

import { optOutWebPush, subscribeToWebPush } from '../lib/webPush';
import { radarAudio } from './radarAudio';

export type ToastType = 'overtake' | 'achievement' | 'radar_drop' | 'cheer' | 'success' | 'info' | 'error';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description: string;
  avatar?: string;
  badge?: string;
  badgeColor?: string;
  actionLabel?: string;
  actionId?: string;
  onAction?: () => void;
  duration?: number; // ms
  createdAt: number;
  meta?: Record<string, any>;
}

const NOTIF_STORAGE_KEY = 'poop_notif_preferences_v1';

export interface NotificationSettings {
  webPushEnabled: boolean;
  emailAlertsEnabled: boolean;
  soundEnabled: boolean;
  radarAlertsEnabled: boolean;
  emailAddress: string;
}

export function getNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(NOTIF_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}

  return {
    webPushEnabled: false,
    emailAlertsEnabled: false,
    soundEnabled: true,
    radarAlertsEnabled: true,
    emailAddress: ''
  };
}

export function saveNotificationSettings(settings: Partial<NotificationSettings>) {
  try {
    const current = getNotificationSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('poop:notification-settings-updated', { detail: updated }));
    return updated;
  } catch (e) {
    return getNotificationSettings();
  }
}

// Request real Web Push permission through the browser's Push API. The server
// stores only the push endpoint and its encryption keys; room membership and
// recipients are resolved server-side from Postgres.
export async function requestWebPushPermission(_userId?: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    const granted = await subscribeToWebPush();
    saveNotificationSettings({ webPushEnabled: granted });
    return granted;
  } catch (e) {
    console.error('Push notification request error:', e);
    return false;
  }
}

export async function unsubscribeWebPush(_userId?: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    await optOutWebPush();
    saveNotificationSettings({ webPushEnabled: false });
    return true;
  } catch (e) {
    console.warn('Push unsubscribe failed:', e);
    return false;
  }
}

// A room event can arrive twice: once through Supabase Realtime (toast) and
// once through Web Push. Keep the fart from firing twice for the same event.
let lastFartAt = 0;

// Sound Synthesizers for various notifications
export function playNotificationSound(type: 'alert' | 'fanfare' | 'radar' | 'cheer' | 'pop' | 'fart' = 'alert') {
  const settings = getNotificationSettings();
  if (!settings.soundEnabled) return;

  if (type === 'fart') {
    const now = Date.now();
    if (now - lastFartAt < 1200) return;
    lastFartAt = now;
    radarAudio.playFart();
    return;
  }

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (type === 'alert') {
      // Dramatic alert chime (Warning)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      gain1.gain.setValueAtTime(0.28, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(440, now + 0.1);
      osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.28);
      gain2.gain.setValueAtTime(0.18, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.48);
    } else if (type === 'fanfare') {
      // Achievement fanfare arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const time = now + i * 0.08;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.22, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.26);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.26);
      });
    } else if (type === 'radar') {
      // Submarine radar sonar ping
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'cheer') {
      // Quick double ascending chirp
      [587.33, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const time = now + i * 0.06;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.22, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.18);
      });
    } else {
      // Clean soft pop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.09);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.11);
    }
  } catch (e) {
    // Non-blocking
  }
}

// In-App Toast Dispatcher
export function showToast(toast: Omit<ToastItem, 'id' | 'createdAt'>) {
  const item: ToastItem = {
    ...toast,
    id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
    duration: toast.duration ?? (toast.type === 'overtake' ? 12000 : 5000)
  };

  // Play corresponding sound
  if (toast.type === 'overtake') playNotificationSound('alert');
  else if (toast.type === 'achievement') playNotificationSound('fanfare');
  else if (toast.type === 'radar_drop') playNotificationSound('fart');
  else if (toast.type === 'cheer') playNotificationSound('cheer');
  else playNotificationSound('pop');

  window.dispatchEvent(new CustomEvent('poop:show-toast', { detail: item }));
  return item;
}
