'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Bell, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { ToastItem } from '../utils/notificationService';

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (event: Event) => {
      const toast = (event as CustomEvent<ToastItem>).detail;
      if (!toast) return;
      setToasts((prev) => [toast, ...prev].slice(0, 4));
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== toast.id));
      }, toast.duration ?? 5000);
    };
    window.addEventListener('poop:show-toast', onToast);
    return () => window.removeEventListener('poop:show-toast', onToast);
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((toast) => toast.id !== id));

  return (
    <div className="fixed z-[80] top-3 right-3 left-3 sm:left-auto sm:w-[360px] space-y-2 pointer-events-none">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            className="pointer-events-auto rounded-2xl bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-700 shadow-xl p-3 flex items-start gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center shrink-0">
              {toast.avatar ? (
                <img src={toast.avatar} alt="" className="w-9 h-9 rounded-xl object-cover" />
              ) : toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : toast.type === 'error' ? (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              ) : toast.type === 'radar_drop' ? (
                <Bell className="w-5 h-5 text-amber-500" />
              ) : (
                <Sparkles className="w-5 h-5 text-amber-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-neutral-950 dark:text-white leading-tight">
                {toast.title}
              </p>
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
                {toast.description}
              </p>
              {toast.badge && (
                <span className="inline-flex mt-1.5 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase">
                  {toast.badge}
                </span>
              )}
              {toast.actionLabel && toast.meta?.groupId && (
                <button
                  onClick={() => {
                    document.getElementById('groups-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    dismiss(toast.id);
                  }}
                  className="mt-2 text-[11px] font-black text-amber-600 dark:text-amber-400 hover:underline"
                >
                  {toast.actionLabel}
                </button>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
