'use client';

import React, { useState } from 'react';
import { Crown, Check, X, Loader2, ShieldCheck, ExternalLink, Users, Sparkles, CreditCard } from 'lucide-react';
import { Group, User } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { showToast } from '../utils/notificationService';
import { invokeFunction } from '../lib/api';

interface RoomPremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group | null;
  currentUser: User | null;
  onUpgraded?: (group: Group) => void;
}

export function isRoomPremium(group: Group | null | undefined): boolean {
  if (!group) return false;
  const premium = (group as any).premium;
  // Legacy VIP flags are not proof of a valid Polar subscription.
  if (!premium) return false;
  const status = String(premium.status);
  if (!['active', 'trialing', 'canceled'].includes(status)) return false;
  if (!premium.currentPeriodEnd) return status !== 'canceled';
  return new Date(premium.currentPeriodEnd).getTime() > Date.now();
}

export const RoomPremiumModal: React.FC<RoomPremiumModalProps> = ({
  isOpen,
  onClose,
  group,
  currentUser,
  onUpgraded
}) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const premium = isRoomPremium(group);
  const isOwner = Boolean(group && currentUser && group.createdBy === currentUser.id);

  if (!isOpen || !group) return null;

  const handleCheckout = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const data = await invokeFunction<any>('premium-checkout', { roomId: group.id });
      if (data.alreadyPremium && data.premium) {
        onUpgraded?.({ ...group, premium: data.premium, isVip: true } as Group);
        onClose();
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(t('Checkout URL was not returned.', 'No se recibió la URL de pago.'));
      }
    } catch (err: any) {
      setError(err?.message || t('Connection error. Try again.', 'Error de conexión. Intenta de nuevo.'));
    } finally {
      setLoading(false);
    }
  };

  const handlePortal = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const data = await invokeFunction<{ url: string }>('premium-portal', { roomId: group.id });
      if (data.url) window.location.href = data.url;
      else setError(t('Could not open the subscription portal.', 'No se pudo abrir el portal de suscripción.'));
    } catch (err: any) {
      setError(err?.message || t('Connection error. Try again.', 'Error de conexión. Intenta de nuevo.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#18181b] border border-amber-300 dark:border-amber-700/60 shadow-2xl p-6 z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-md">
            <Crown className="w-7 h-7 text-neutral-950 fill-neutral-950/20" />
          </div>
          <div>
            <h2 className="text-lg font-black text-neutral-950 dark:text-white">
              {t('Room Premium', 'Sala Premium')}
            </h2>
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
              {group.name}
            </p>
          </div>
        </div>

        {premium ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-4">
              <p className="text-sm font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4" /> {t('Premium is active', 'Premium está activo')}
              </p>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                {t('Unlimited members in this room.', 'Miembros ilimitados en esta sala.')}
              </p>
              {(group as any).premium?.currentPeriodEnd && (
                <p className="text-[11px] font-semibold text-emerald-600/80 dark:text-emerald-400/80 mt-2">
                  {t('Renews/ends', 'Renueva/termina')}:{' '}
                  {new Date((group as any).premium.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
            {isOwner && (
              <button
                onClick={handlePortal}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 text-sm font-black text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                {t('Manage subscription', 'Gestionar suscripción')}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-4 space-y-2">
              <div className="flex items-end gap-1">
                <span className="text-3xl font-black text-neutral-950 dark:text-white">$2.99</span>
                <span className="text-sm font-bold text-neutral-500 dark:text-neutral-400 mb-1">/ {t('month', 'mes')}</span>
              </div>
              <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                {t('One subscription for the whole room. Paid by the host.', 'Una suscripción para toda la sala. La paga el anfitrión.')}
              </p>
            </div>

            <div className="space-y-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              <p className="flex items-center gap-2"><Users className="w-4 h-4 text-amber-500" /> {t('Unlimited room members', 'Miembros ilimitados en la sala')}</p>
              <p className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" /> {t('Premium crown and room badge', 'Corona Premium y distintivo de sala')}</p>
              <p className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-amber-500" /> {t('Cancel anytime from the portal', 'Cancela cuando quieras desde el portal')}</p>
              <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> {t('Logging a poop is always free', 'Registrar un popó siempre es gratis')}</p>
            </div>

            <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 p-3 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
              {t(
                'The free plan allows 5 members including the host. If Premium expires, existing members stay and new joins are blocked until the room has 5 or fewer.',
                'El plan gratis permite 5 miembros incluyendo al anfitrión. Si Premium expira, los miembros actuales se quedan y se bloquean nuevas entradas hasta tener 5 o menos.'
              )}
            </div>

            {error && (
              <p className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-xl p-3">
                {error}
              </p>
            )}

            {isOwner ? (
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-neutral-950 text-sm font-black shadow-lg shadow-amber-500/20 disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                {t('Activate Premium · $2.99/mo', 'Activar Premium · $2.99/mes')}
              </button>
            ) : (
              <p className="text-xs font-bold text-center text-neutral-500 dark:text-neutral-400">
                {t('Only the room host can activate Premium.', 'Solo el anfitrión de la sala puede activar Premium.')}
              </p>
            )}

            <button
              onClick={onClose}
              className="w-full text-xs font-bold text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 py-1"
            >
              {t('Maybe later', 'Quizás luego')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
