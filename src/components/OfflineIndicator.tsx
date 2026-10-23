import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function useOnlineStatus() {
  // Start online on both the server and the first client render so hydration
  // matches, then read the real status after mount.
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-neutral-900/90 backdrop-blur-md border border-neutral-700 px-3.5 py-2 text-xs font-bold text-amber-300 shadow-xl animate-in slide-in-from-bottom-2 duration-200">
      <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
      <span>Modo sin conexión — Mostrando datos en caché</span>
    </div>
  );
};
