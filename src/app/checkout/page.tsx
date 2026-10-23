'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Crown, Loader2 } from 'lucide-react';
import { invokeFunction } from '@/lib/api';
import { getSupabase } from '@/lib/supabase/client';

export default function CheckoutPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando tu suscripción...');

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabase();

    const verify = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;

      if (!session?.user) {
        setStatus('error');
        setMessage('Inicia sesión con la cuenta del anfitrión para verificar la suscripción.');
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const roomId =
        params.get('group_id') ||
        params.get('groupId') ||
        params.get('group') ||
        '';
      const checkoutId =
        params.get('checkout_id') ||
        params.get('checkoutId') ||
        params.get('session_id') ||
        '';

      if (!roomId) {
        setStatus('error');
        setMessage('No encontramos la sala que se intentó activar.');
        return;
      }

      try {
        const data = await invokeFunction<{ group?: { code?: string } }>(
          'premium-verify',
          { roomId, checkoutId }
        );

        if (cancelled) return;
        setStatus('success');
        setMessage('¡Sala Premium activada! Redirigiendo...');
        setTimeout(() => {
          window.location.href = `/?group=${encodeURIComponent(data.group?.code || '')}`;
        }, 1200);
      } catch (err: any) {
        if (cancelled) return;
        setStatus('error');
        setMessage(err?.message || 'No pudimos verificar la suscripción.');
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#faf8f5] dark:bg-[#0f0f11] p-6">
      <div className="max-w-sm w-full rounded-3xl bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 p-8 text-center space-y-4 shadow-xl">
        <div className="flex justify-center">
          {status === 'success' ? (
            <Crown className="w-14 h-14 text-amber-500 fill-amber-400" />
          ) : status === 'error' ? (
            <AlertTriangle className="w-14 h-14 text-amber-500" />
          ) : (
            <Loader2 className="w-14 h-14 text-amber-500 animate-spin" />
          )}
        </div>
        <h1 className="text-xl font-black text-neutral-950 dark:text-white">
          {status === 'success' ? 'Premium activado' : status === 'error' ? 'No se pudo activar' : 'Procesando'}
        </h1>
        <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">{message}</p>
        {status === 'error' && (
          <Link href="/" className="inline-flex px-5 py-3 rounded-2xl bg-amber-400 text-neutral-950 font-black text-sm">
            Volver a la app
          </Link>
        )}
      </div>
    </main>
  );
}
