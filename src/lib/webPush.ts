'use client';

import { registerPushSubscription, unregisterPushSubscription } from './api';

const SW_PATH = '/sw.js';
const SW_SCOPE = '/';

let registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

export function webPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;

  // A development server recompiles modules constantly. Letting a service
  // worker cache those chunks causes stale module errors, so only enable it in
  // production and clean up registrations left over from a dev session.
  if (process.env.NODE_ENV !== 'production') {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch (error) {
      console.warn('Service worker cleanup failed:', error);
    }
    return null;
  }

  if (registrationPromise) return registrationPromise;

  registrationPromise = (async () => {
    try {
      // Register (or update) the same path every time so a service worker left
      // over from the previous OneSignal integration is replaced promptly.
      return await navigator.serviceWorker.register(SW_PATH, { scope: SW_SCOPE });
    } catch (error) {
      console.warn('Service worker registration failed:', error);
      registrationPromise = null;
      return null;
    }
  })();

  return registrationPromise;
}

function base64UrlToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index);
  }
  return bytes;
}

function arrayBufferToBase64Url(value: ArrayBuffer | ArrayBufferView | null): string {
  if (!value) return '';
  const bytes =
    value instanceof ArrayBuffer
      ? new Uint8Array(value)
      : new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function platformName(): string {
  if (typeof navigator === 'undefined') return 'web';
  const userAgent = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
  if (/android/.test(userAgent)) return 'android';
  return 'web';
}

function storedSubscription(subscription: PushSubscription) {
  const p256dh = arrayBufferToBase64Url(subscription.getKey('p256dh'));
  const auth = arrayBufferToBase64Url(subscription.getKey('auth'));

  if (!p256dh || !auth) {
    throw new Error('INVALID_SUBSCRIPTION');
  }

  return {
    endpoint: subscription.endpoint,
    p256dh,
    auth,
    platform: platformName(),
  };
}

async function saveSubscription(subscription: PushSubscription) {
  await registerPushSubscription(storedSubscription(subscription));
}

function subscriptionUsesKey(subscription: PushSubscription, publicKey: string): boolean {
  const options = (
    subscription as PushSubscription & {
      options?: { applicationServerKey?: BufferSource | null };
    }
  ).options;
  const currentKey = options?.applicationServerKey;
  return !currentKey || arrayBufferToBase64Url(currentKey) === publicKey;
}

async function ensureSubscription(
  registration: ServiceWorkerRegistration,
  publicKey: string
): Promise<PushSubscription> {
  let subscription = await registration.pushManager.getSubscription();

  // The browser may still have a subscription created with an older VAPID key
  // (for example the OneSignal service worker). Replace it before registering.
  if (subscription && !subscriptionUsesKey(subscription, publicKey)) {
    await subscription.unsubscribe();
    subscription = null;
  }

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(publicKey),
    });
  }

  return subscription;
}

export async function syncWebPushSubscription(): Promise<void> {
  if (!webPushSupported() || Notification.permission !== 'granted') return;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
  if (!publicKey) return;

  try {
    const registration = await registerServiceWorker();
    if (!registration) return;
    const subscription = await ensureSubscription(registration, publicKey);
    await saveSubscription(subscription);
  } catch (error) {
    console.warn('Web Push subscription sync failed:', error);
  }
}

export async function subscribeToWebPush(): Promise<boolean> {
  if (!webPushSupported()) return false;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
  if (!publicKey) {
    console.warn('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not configured.');
    return false;
  }

  try {
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;
    } else if (Notification.permission !== 'granted') {
      return false;
    }

    const registration = await registerServiceWorker();
    if (!registration) return false;

    const subscription = await ensureSubscription(registration, publicKey);
    await saveSubscription(subscription);
    return true;
  } catch (error) {
    console.warn('Web Push permission request failed:', error);
    return false;
  }
}

export async function optOutWebPush(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.getRegistration(SW_SCOPE);
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return;

    await unregisterPushSubscription(subscription.endpoint).catch(() => undefined);
    await subscription.unsubscribe();
  } catch (error) {
    console.warn('Web Push opt-out failed:', error);
  }
}
