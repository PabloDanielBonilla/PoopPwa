import React from 'react';
import { User } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { PWAInstallButton } from './PWAInstallButton';

interface HeroProps {
  currentUser: User | null;
  activeGroup?: any;
  userGroups?: any[];
  onSelectGroup?: (group: any | null) => void;
  onCreateGroup?: () => void;
  onJoinGroup?: () => void;
  onOpenPaymentModal: () => void;
  onLogPoop?: () => void;
  onOpenHowItWorks?: () => void;
  onOpenGroups?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  currentUser,
  onOpenPaymentModal,
  onLogPoop,
}) => {
  const { t } = useLanguage();

  return (
    <section 
      id="counter-hero" 
      className="w-full text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-5 lg:gap-8 p-5 sm:p-6 lg:p-8 bg-white/60 dark:bg-[#18181b]/60 lg:bg-gradient-to-br lg:from-amber-100/70 lg:via-amber-50/50 lg:to-white dark:lg:from-amber-950/20 dark:lg:via-[#18181b] dark:lg:to-[#18181b] rounded-3xl border border-neutral-100 dark:border-neutral-800 lg:border-amber-200/90 dark:lg:border-amber-900/40 shadow-2xs transition-all"
    >
      
      {/* Crown + Poop Illustration Mascot - FIRST on mobile */}
      <div className="shrink-0 flex flex-col items-center justify-center relative select-none order-first lg:order-last my-1 lg:my-0">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-amber-300/40 dark:bg-amber-500/20 blur-3xl -z-10 scale-125 pointer-events-none" />
          <img 
            src="/popohero1_transparent.png?v=2" 
            alt="poop mascot" 
            className="w-40 h-40 sm:w-52 sm:h-52 lg:w-64 lg:h-64 xl:w-72 xl:h-72 object-contain drop-shadow-xl transition-transform hover:scale-105"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Main Content (Headline, Subtitle, CTA Button) - No groups, no banners */}
      <div className="flex-1 min-w-0 max-w-full lg:max-w-xl mx-auto lg:mx-0 w-full flex flex-col items-center lg:items-start select-none overflow-hidden">
        
        {/* Headline */}
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight text-neutral-950 dark:text-white uppercase leading-tight text-center lg:text-left w-full max-w-full break-words [overflow-wrap:anywhere] [word-break:break-word]">
          {t('Who poops more in', '¿QUIÉN VA MÁS AL BAÑO EN')}<br />
          <span className="text-amber-500 relative inline-block">
            {t('your group?', 'TU GRUPO?')}
            <svg
              className="absolute -bottom-1 left-0 w-full h-2 text-amber-400 opacity-90 -z-10 pointer-events-none max-w-full"
              viewBox="0 0 200 12"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M3 9C50 2 150 2 197 9"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h1>

        {/* Crisp Subtitle */}
        <p className="mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-semibold max-w-md text-center lg:text-left">
          {t(
            'Log your drops, compete with your group, and find out who rules the throne.',
            'Registra tus idas al baño, compite con tu grupo y descubre quién domina el trono.'
          )}
        </p>

        {/* Main CTA Button: ¡ACABO DE CAGAR! +1 (Clean, without group name) */}
        <div className="w-full max-w-md lg:max-w-sm flex flex-col items-center lg:items-start gap-1.5 mt-4">
          <button
            onClick={() => {
              if (onLogPoop) {
                onLogPoop();
              } else {
                onOpenPaymentModal();
              }
            }}
            id="cta-i-just-pooped"
            className="w-full bg-[#facc15] hover:bg-[#eab308] active:scale-[0.98] text-neutral-950 font-black text-base sm:text-xl tracking-tight py-4 px-5 sm:px-6 rounded-full shadow-[0_4px_0_#ca8a04] hover:shadow-[0_2px_0_#ca8a04] active:shadow-none transition-all cursor-pointer flex items-center justify-between border-2 border-amber-400/80 group"
          >
            <span className="flex items-center gap-2 text-base sm:text-lg truncate mr-2">
              <span className="truncate">
                {t('I JUST POOPED!', '¡ACABO DE CAGAR!')}
              </span>
            </span>
            <span className="text-xs bg-neutral-950 text-[#facc15] font-black px-2.5 py-1 rounded-full uppercase tracking-wider group-hover:scale-105 transition-transform shrink-0">
              +1
            </span>
          </button>

          {/* Universal PWA Install Link */}
          <PWAInstallButton variant="hero" className="w-full mt-1" />
        </div>

      </div>

    </section>
  );
};
