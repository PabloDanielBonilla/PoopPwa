import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface CookieBannerProps {
  onOpenPrivacy: () => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({ onOpenPrivacy }) => {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('pooplol_cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = (choice: 'all' | 'essential') => {
    localStorage.setItem('pooplol_cookie_consent', choice);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 bg-white/95 dark:bg-[#1f1f23]/95 backdrop-blur-md border border-neutral-200 dark:border-neutral-700/80 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-5 duration-300 select-none">
      <div className="flex items-start justify-between gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/70 flex items-center justify-center shrink-0">
          <Cookie className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-extrabold text-xs sm:text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
            <span>{t('Cookie & Privacy Preferences', 'Cookies y Preferencias de Privacidad')}</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          </h4>
          <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-1 leading-snug">
            {t(
              'We use essential cookies and local storage to keep your session, language, theme, and room preferences. Payments are handled securely by Polar only when a host chooses Room Premium. No advertising cookies.',
              'Usamos cookies esenciales y almacenamiento local para mantener tu sesión, idioma, tema y preferencias de sala. Los pagos los gestiona Polar de forma segura solo cuando un anfitrión elige Sala Premium. Sin cookies publicitarias.'
            )}
          </p>
        </div>
        <button
          onClick={() => handleAccept('essential')}
          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 cursor-pointer"
          title={t('Close', 'Cerrar')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80">
        <button
          type="button"
          onClick={onOpenPrivacy}
          className="text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
        >
          {t('Privacy Policy', 'Política de Privacidad')}
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleAccept('essential')}
            className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-extrabold text-[11px] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            {t('Essential Only', 'Solo Esenciales')}
          </button>
          <button
            type="button"
            onClick={() => handleAccept('all')}
            className="px-3.5 py-1.5 rounded-xl bg-neutral-950 dark:bg-amber-400 hover:bg-neutral-800 dark:hover:bg-amber-300 text-white dark:text-neutral-950 font-extrabold text-[11px] transition-colors shadow-xs cursor-pointer"
          >
            {t('Accept All', 'Aceptar Todo')}
          </button>
        </div>
      </div>
    </div>
  );
};
