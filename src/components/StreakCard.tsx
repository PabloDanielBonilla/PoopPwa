import React, { useEffect, useState } from 'react';
import { Flame, Calendar, TrendingUp } from 'lucide-react';
import { User } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface StreakCardProps {
  currentUser: User | null;
}

export const StreakCard: React.FC<StreakCardProps> = ({ currentUser }) => {
  const { language, t } = useLanguage();
  const streak = currentUser?.currentStreak ?? (currentUser?.totalPoops && currentUser.totalPoops > 0 ? 1 : 0);

  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
  }, []);

  if (!now) {
    return (
      <div className="w-full bg-white dark:bg-[#161618] rounded-3xl p-5 sm:p-6 shadow-md border border-neutral-200/90 dark:border-neutral-800/80 min-h-[220px] animate-pulse" />
    );
  }
  const getLocalDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateStr(now);

  // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const todayIndex = now.getDay();
  // Monday-first index: 0 = Monday, ..., 6 = Sunday
  const currentDayIndexMonSun = todayIndex === 0 ? 6 : todayIndex - 1;

  // Monday date of current week safely calculated
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - currentDayIndexMonSun);

  const dayNamesEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayNamesEs = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const dayNames = language === 'es' ? dayNamesEs : dayNamesEn;

  const daysOfWeek = dayNames.map((label, idx) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + idx);
    const dateStr = getLocalDateStr(d);

    const isToday = idx === currentDayIndexMonSun;
    const isPast = idx < currentDayIndexMonSun;
    const isFuture = idx > currentDayIndexMonSun;

    let count = 0;
    if (!isFuture && currentUser?.dailyHistory && Array.isArray(currentUser.dailyHistory)) {
      const match = currentUser.dailyHistory.find(h => h.date === dateStr);
      if (match) {
        count = match.count;
      }
    }

    // Always synchronize today with the most up-to-date poopsToday count
    if (isToday) {
      count = Math.max(count, currentUser?.poopsToday ?? 0);
      if (count === 0 && (currentUser?.totalPoops ?? 0) > 0 && (!currentUser?.dailyHistory || currentUser.dailyHistory.length === 0)) {
        count = currentUser?.totalPoops ?? 0;
      }
    }

    return {
      label,
      dateStr,
      count,
      isPast,
      isToday,
    };
  });

  const poopsToday = daysOfWeek.find(d => d.isToday)?.count ?? (currentUser?.poopsToday ?? 0);
  const poopsThisWeek = daysOfWeek.reduce((sum, d) => sum + d.count, 0);

  const maxDaily = Math.max(...daysOfWeek.map(d => d.count), 2);

  return (
    <div className="w-full bg-white dark:bg-[#161618] text-neutral-900 dark:text-white rounded-3xl p-5 sm:p-6 shadow-md border border-neutral-200/90 dark:border-neutral-800/80 select-none transition-colors duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black tracking-wider uppercase">
          <span>{t('POOPS BY DAY & WEEK', 'POPÓS POR DÍA Y SEMANA')}</span>
          <Flame className="w-3.5 h-3.5 text-amber-500" />
        </div>
        <div className="flex items-center gap-1 text-[11px] sm:text-xs font-black tracking-widest text-amber-500 dark:text-amber-400 uppercase">
          <Flame className="w-3.5 h-3.5 fill-amber-500 dark:fill-amber-400" />
          <span>{streak} {t('DAY STREAK', 'DÍAS RACHA')}</span>
        </div>
      </div>

      {/* Daily & Weekly Big Stat Badges */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        
        {/* Poops Today */}
        <div className="bg-neutral-50 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-500 dark:text-amber-400" />
              <span>{t('TODAY', 'HOY')}</span>
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-extrabold text-[9px] bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-sm">
              {t('ACTIVE', 'ACTIVO')}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl sm:text-3xl font-black text-neutral-950 dark:text-white tabular-nums leading-none">
              {poopsToday}
            </span>
            <span className="text-xs font-extrabold text-neutral-500 dark:text-neutral-400 uppercase">
              {poopsToday === 1 ? t('poop', 'popó') : t('poops', 'popós')}
            </span>
          </div>
        </div>

        {/* Poops This Week */}
        <div className="bg-neutral-50 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-1">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-amber-500 dark:text-amber-400" />
              <span>{t('THIS WEEK', 'ESTA SEMANA')}</span>
            </span>
            <span className="text-amber-700 dark:text-amber-400 font-extrabold text-[9px] bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-sm">
              {t('7 DAYS', '7 DÍAS')}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tabular-nums leading-none">
              {poopsThisWeek}
            </span>
            <span className="text-xs font-extrabold text-neutral-500 dark:text-neutral-400 uppercase">
              {t('poops', 'popós')}
            </span>
          </div>
        </div>

      </div>

      {/* 7-Day Visual Mini Bar Chart */}
      <div className="bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/60 rounded-2xl p-3 transition-colors">
        <div className="flex items-center justify-between text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase mb-2 px-1">
          <span>{t('WEEKLY BREAKDOWN', 'DESGLOSE SEMANAL')}</span>
          <span className="text-neutral-400 dark:text-neutral-500 font-mono">{(poopsThisWeek / 7).toFixed(1)} / {t('day', 'día')}</span>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 items-end pt-1">
          {daysOfWeek.map((day, idx) => {
            const heightPercent = day.count > 0 ? Math.max(30, (day.count / maxDaily) * 100) : 10;
            return (
              <div key={idx} className="flex flex-col items-center gap-1.5">
                {/* Count Badge on Top of Bar */}
                <span className={`text-[10px] font-black tabular-nums ${
                  day.isToday 
                    ? 'text-amber-600 dark:text-amber-400' 
                    : day.count > 0 
                    ? 'text-neutral-700 dark:text-neutral-200' 
                    : 'text-neutral-400 dark:text-neutral-600'
                }`}>
                  {day.count}
                </span>

                {/* Vertical Bar */}
                <div className="w-full h-12 bg-neutral-200 dark:bg-neutral-800/80 rounded-lg flex items-end p-0.5">
                  <div
                    className={`w-full rounded-md transition-all duration-500 ${
                      day.isToday
                        ? 'bg-gradient-to-t from-amber-500 to-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                        : day.count > 0
                        ? 'bg-neutral-400 dark:bg-neutral-600'
                        : 'bg-neutral-300 dark:bg-neutral-800'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>

                {/* Day of Week Label */}
                <span className={`text-[10px] font-bold uppercase ${
                  day.isToday ? 'text-amber-600 dark:text-amber-400 font-black' : 'text-neutral-500 dark:text-neutral-400'
                }`}>
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Motivation */}
      <div className="mt-3.5 text-center text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
        {currentUser?.totalPoops && currentUser.totalPoops > 0 ? (
          <span>{t('Keep logging every day to maintain your streak!', '¡Sigue registrando todos los días para mantener tu racha!')}</span>
        ) : (
          <span>{t('Log your first poop today to start your daily streak!', '¡Registra tu primer popó hoy para iniciar tu racha!')}</span>
        )}
      </div>

    </div>
  );
};
