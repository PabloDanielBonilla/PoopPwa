import React from 'react';
import { X, ArrowRight, CheckCircle2, Shield, Flame, Globe2, Sparkles, Trophy, Zap, MousePointerClick, Heart } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPaymentModal: () => void;
  onLogPoop?: () => void;
  onOpenLeaderboard?: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  isOpen,
  onClose,
  onOpenPaymentModal,
  onLogPoop,
  onOpenLeaderboard,
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const handleAction = () => {
    onClose();
    if (onLogPoop) {
      onLogPoop();
    } else {
      onOpenPaymentModal();
    }
  };

  return (
    <div 
      id="how-it-works-modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden"
    >
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/65 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white dark:bg-[#18181b] text-neutral-950 dark:text-white rounded-t-2xl sm:rounded-3xl max-w-xl w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl border-t sm:border border-neutral-200 dark:border-neutral-800 z-10 animate-in slide-in-from-bottom-3 sm:zoom-in-95 duration-150 overflow-hidden">
        
        {/* Mobile Pull Indicator */}
        <div className="w-10 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="px-5 sm:px-7 pt-4 sm:pt-6 pb-4 border-b border-neutral-100 dark:border-neutral-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100/90 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-700/60 flex items-center justify-center shrink-0">
              <img src="/popohero1_transparent.png?v=2" alt="poop.lol" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-neutral-950 dark:text-white tracking-tight leading-snug flex items-center gap-1.5">
                <span>{t('poop.lol Guide', 'Guía de poop.lol')}</span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('Private rooms for competitive bathroom tracking.', 'Salas privadas para el registro competitivo de evacuaciones.')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 mt-0.5"
            title={t('Close', 'Cerrar')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="px-5 sm:px-7 py-5 overflow-y-auto flex-1 space-y-5 overscroll-contain">
          
          {/* Main 3 Progression Steps */}
          <div className="space-y-3">
            {/* Step 1 */}
            <div className="p-4 rounded-2xl bg-neutral-50/90 dark:bg-neutral-900/90 border border-neutral-200/70 dark:border-neutral-800 relative">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-neutral-800 text-white font-mono text-xs font-black flex items-center justify-center shrink-0 border border-transparent dark:border-neutral-700">
                  1
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-neutral-950 dark:text-white">
                      {t('Answer the Call in Real Life', 'Atiende el Llamado en la Vida Real')}
                    </h4>
                    <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 bg-neutral-200/60 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                      {t('Honor System', 'Código de Honor')}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed">
                    {t(
                      'Step into the restroom and take care of business. No cameras, no intrusive Bluetooth scales, just pure personal integrity between you and the porcelain.',
                      'Ve al sanitario y haz lo tuyo. Sin cámaras ni básculas invasivas, solo pura integridad entre tú y el inodoro.'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 relative">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-neutral-950 font-mono text-xs font-black flex items-center justify-center shrink-0 shadow-xs">
                  2
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-neutral-950 dark:text-white">
                      {t('Hit "I JUST POOPED!"', 'Toca "¡ACABO DE CAGAR!"')}
                    </h4>
                    <span className="text-[10px] font-bold text-amber-900 dark:text-amber-300 bg-amber-200/70 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
                      {t('Instant Sync', 'Sincronización Instantánea')}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-1 leading-relaxed">
                    {t(
                      'Tap the button immediately after. It is always free, with no coins or payment. Your +1 counts only inside your private room.',
                      'Presiona el botón justo después. Siempre es gratis, sin monedas ni pagos. Tu +1 cuenta solo dentro de tu sala privada.'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-2xl bg-neutral-50/90 dark:bg-neutral-900/90 border border-neutral-200/70 dark:border-neutral-800 relative">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-neutral-800 text-white font-mono text-xs font-black flex items-center justify-center shrink-0 border border-transparent dark:border-neutral-700">
                  3
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-neutral-950 dark:text-white">
                      {t('Climb Your Room Leaderboard', 'Sube en la Clasificación de tu Sala')}
                    </h4>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                      {t('Live Rankings', 'Tabla en Vivo')}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed">
                    {t(
                      'Watch your room rank change live, keep your daily streak alive, and challenge only the people in your private room.',
                      'Mira cambiar tu puesto en la sala, mantén tu racha diaria encendida y reta solo a las personas de tu sala privada.'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 flex items-start gap-2.5">
              <Flame className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-neutral-900 dark:text-white">{t('Daily Streaks', 'Racha Diaria')}</div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">{t('Log at least once every 24h to protect your flame.', 'Registra al menos una vez cada 24h para proteger tu llama.')}</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 flex items-start gap-2.5">
              <Trophy className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-neutral-900 dark:text-white">{t('Hall of Fame', 'Salón de la Fama')}</div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">{t('The member with the most poops becomes the room king.', 'El miembro con más popós se corona como rey de la sala.')}</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 flex items-start gap-2.5">
              <Globe2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-neutral-900 dark:text-white">{t('Room Alerts', 'Alertas de Sala')}</div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">{t('Real-time notifications when someone in your room logs a poop.', 'Notificaciones en tiempo real cuando alguien de tu sala registra un popó.')}</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-neutral-900 dark:text-white">{t('Total Privacy', 'Privacidad Total')}</div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">{t('Pick any alias or avatar. Zero personal data required.', 'Usa cualquier alias o avatar. Sin datos personales.')}</div>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-7 py-3.5 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            id="how-it-works-cta"
            onClick={handleAction}
            className="w-full sm:w-auto flex-1 py-3 px-5 bg-amber-400 hover:bg-amber-300 active:translate-y-0.5 text-neutral-950 font-black text-xs sm:text-sm rounded-xl shadow-[0_2px_0_#ca8a04] transition-all cursor-pointer flex items-center justify-center gap-2 border border-amber-500/30 tracking-tight"
          >
            <span>{t('START NOW — LOG A POOP', 'COMENZAR AHORA — REGISTRAR POPÓ')}</span>
            <ArrowRight className="w-4 h-4 text-neutral-950" />
          </button>

          {onOpenLeaderboard && (
            <button
              onClick={() => {
                onClose();
                onOpenLeaderboard();
              }}
              className="w-full sm:w-auto px-4 py-3 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer text-center"
            >
              {t('View Rooms', 'Ver Salas')}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
