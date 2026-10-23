import React from 'react';
import { GlobalStats } from '../types';
import { Users, Calendar, Crown, DoorOpen, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface FeatureCardsProps {
  stats: GlobalStats;
}

export const FeatureCards: React.FC<FeatureCardsProps> = ({ stats }) => {
  const { t } = useLanguage();
  const safe = {
    totalPoops: Number(stats?.totalPoops || 0),
    totalUsers: Number(stats?.totalUsers || stats?.poopersWorldwide || 0),
    totalRooms: Number(stats?.totalRooms || stats?.activeRooms || 0),
    activeRooms: Number(stats?.activeRooms || stats?.totalRooms || 0),
    premiumRooms: Number(stats?.premiumRooms || 0),
    poopsToday: Number(stats?.poopsToday || 0),
    countriesRepresented: Number(stats?.countriesRepresented || 0)
  };

  const items = [
    {
      label: t('TOTAL POOPS', 'TOTAL POPÓS'),
      value: safe.totalPoops.toLocaleString(),
      icon: <img src="/popohero1_transparent.png?v=2" alt="Poops" className="w-6 h-6 object-contain" />
    },
    {
      label: t('PRIVATE ROOMS', 'SALAS PRIVADAS'),
      value: safe.activeRooms.toLocaleString(),
      icon: <DoorOpen className="w-5 h-5 text-blue-700 dark:text-blue-400" />
    },
    {
      label: t('POOPERS', 'JUGADORES'),
      value: safe.totalUsers.toLocaleString(),
      icon: <Users className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />
    },
    {
      label: t('POOPS TODAY', 'POPÓS HOY'),
      value: safe.poopsToday.toLocaleString(),
      icon: <Calendar className="w-5 h-5 text-amber-700 dark:text-amber-400" />
    },
    {
      label: t('PREMIUM ROOMS', 'SALAS PREMIUM'),
      value: safe.premiumRooms.toLocaleString(),
      icon: <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
    },
    {
      label: t('COUNTRIES', 'PAÍSES'),
      value: safe.countriesRepresented.toLocaleString(),
      icon: <Globe className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
    }
  ];

  return (
    <section id="stats" className="pt-2 pb-4">
      <div className="hidden lg:grid lg:grid-cols-3 gap-4 bg-white dark:bg-[#18181b] rounded-3xl border border-neutral-200/90 dark:border-neutral-800 p-5 shadow-xs">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3.5 p-2 bg-neutral-50/80 dark:bg-neutral-900/60 rounded-2xl border border-neutral-100 dark:border-neutral-800"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center shrink-0">
              {item.icon}
            </div>
            <div>
              <div className="text-xl font-black text-neutral-950 dark:text-white tracking-tight">
                {item.value}
              </div>
              <div className="text-[11px] font-extrabold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">
                {item.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="lg:hidden grid grid-cols-3 gap-1.5 py-2 rounded-3xl bg-white dark:bg-[#18181b] border border-neutral-200/80 dark:border-neutral-800 p-2">
        {items.map((item) => (
          <div key={item.label} className="p-2 flex flex-col items-center text-center min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center mb-1">
              {item.icon}
            </div>
            <div className="font-black text-xs text-neutral-950 dark:text-white truncate max-w-full">{item.value}</div>
            <div className="text-[8px] font-extrabold text-neutral-400 dark:text-neutral-500 uppercase tracking-tight leading-tight">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
