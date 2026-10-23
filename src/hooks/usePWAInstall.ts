import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export type BrowserType = 
  | 'ios-safari'
  | 'ios-chrome'
  | 'android-chrome'
  | 'android-samsung'
  | 'android-firefox'
  | 'desktop-chrome'
  | 'desktop-edge'
  | 'desktop-safari'
  | 'desktop-firefox'
  | 'other';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [browserType, setBrowserType] = useState<BrowserType>('other');

  useEffect(() => {
    // Detect standalone mode (already installed on Android, iOS, or Desktop)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');
    setIsInstalled(isStandalone);

    const ua = (window.navigator.userAgent || '').toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    const isAndroidDevice = /android/.test(ua);
    const isDesktopDevice = !isIOSDevice && !isAndroidDevice;

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsDesktop(isDesktopDevice);

    // Browser type detection
    if (isIOSDevice) {
      if (/crios/.test(ua)) setBrowserType('ios-chrome');
      else setBrowserType('ios-safari');
    } else if (isAndroidDevice) {
      if (/samsungbrowser/.test(ua)) setBrowserType('android-samsung');
      else if (/firefox/.test(ua)) setBrowserType('android-firefox');
      else setBrowserType('android-chrome');
    } else {
      if (/edg/.test(ua)) setBrowserType('desktop-edge');
      else if (/chrome|chromium/.test(ua)) setBrowserType('desktop-chrome');
      else if (/safari/.test(ua)) setBrowserType('desktop-safari');
      else if (/firefox/.test(ua)) setBrowserType('desktop-firefox');
      else setBrowserType('other');
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
    } catch (e) {
      console.warn('PWA install prompt error:', e);
    }
    return false;
  };

  return {
    isInstallable: true, // Always show installable since we provide guided install fallback for all browsers
    canPromptNative: !!deferredPrompt,
    isInstalled,
    isIOS,
    isAndroid,
    isDesktop,
    browserType,
    install,
  };
}
