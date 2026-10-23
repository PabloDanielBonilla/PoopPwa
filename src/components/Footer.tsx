import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface FooterProps {
  onOpenInfo: (type: 'terms' | 'refund' | 'privacy') => void;
  onOpenHowItWorks?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenInfo, onOpenHowItWorks }) => {
  const { t } = useLanguage();

  return (
    <footer className="w-full border-t border-neutral-200/80 dark:border-neutral-800 bg-white/80 dark:bg-[#121214] py-8 px-4 mt-12 select-none">
      <div className="max-w-7xl 2xl:max-w-[1480px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
        
        {/* Left branding */}
        <div className="flex items-center gap-2">
          <span className="font-black text-neutral-900 dark:text-white">poop.lol</span>
          <span className="text-neutral-300 dark:text-neutral-700">|</span>
          <span>{t('Private room poop competitions', 'Competiciones de popó en salas privadas')}</span>
        </div>

        {/* Right Legal & Help Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
          {onOpenHowItWorks && (
            <button
              onClick={onOpenHowItWorks}
              className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer"
            >
              {t('How It Works', 'Cómo Funciona')}
            </button>
          )}

          <button
            onClick={() => onOpenInfo('terms')}
            className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer"
          >
            {t('Terms of Service', 'Términos de Servicio')}
          </button>

          <button
            onClick={() => onOpenInfo('refund')}
            className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer"
          >
            {t('Refund Policy', 'Política de Reembolsos')}
          </button>

          <button
            onClick={() => onOpenInfo('privacy')}
            className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer"
          >
            {t('Privacy Policy', 'Política de Privacidad')}
          </button>
        </div>
      </div>

      <div className="max-w-7xl 2xl:max-w-[1480px] mx-auto text-center text-[10px] text-neutral-400 dark:text-neutral-600 mt-4">
        {t(
          'Copyright 2026 poop.lol. All rights reserved. Satirical entertainment and private-room poop tracking. Logging a poop is always free.',
          'Copyright 2026 poop.lol. Todos los derechos reservados. Entretenimiento recreativo y registro de popós en salas privadas. Registrar un popó siempre es gratis.'
        )}
      </div>
    </footer>
  );
};
