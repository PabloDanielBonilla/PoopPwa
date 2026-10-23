'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { StreakCard } from './StreakCard';
import { ShareRankCard } from './ShareRankCard';
import { FeatureCards } from './FeatureCards';
import { Footer } from './Footer';
import { CelebrationModal } from './CelebrationModal';
import { ShareModal } from './ShareModal';
import { AuthModal } from './AuthModal';
import { ProfileModal } from './ProfileModal';
import { HowItWorksModal } from './HowItWorksModal';
import { InfoModal } from './InfoModals';
import { CookieBanner } from './CookieBanner';
import { WrappedModal } from './WrappedModal';
import { GroupsSection } from './GroupsSection';
import { OfflineIndicator } from './OfflineIndicator';
import { ToastHost } from './ToastHost';
import { RoomNotifications } from './RoomNotifications';
import { Group, User } from '../types';
import { getNotificationSettings, showToast, playNotificationSound } from '../utils/notificationService';
import { radarAudio } from '../utils/radarAudio';
import { ensureProfile, logPoop } from '../lib/api';
import { signOut } from '../lib/auth';
import { getSupabase } from '../lib/supabase/client';
import { optOutWebPush, registerServiceWorker, syncWebPushSubscription } from '../lib/webPush';

type InfoType = 'terms' | 'refund' | 'privacy' | 'faq' | null;

interface CelebrationData {
  previousRank: number;
  newRank: number;
  poopCount: number;
  username: string;
  isTopSpot: boolean;
  streak?: number;
  groupInfo?: {
    groupId: string;
    groupName: string;
    groupRank: number;
    previousGroupRank?: number;
    groupPoops: number;
    isGroupKing: boolean;
    totalMembers: number;
  } | null;
}

const EMPTY_STATS = {
  totalPoops: 0,
  totalUsers: 0,
  poopersWorldwide: 0,
  totalRooms: 0,
  activeRooms: 0,
  premiumRooms: 0,
  poopsToday: 0,
  countriesRepresented: 0
};

function mapStats(data: any) {
  if (!data) return EMPTY_STATS;
  return {
    ...EMPTY_STATS,
    ...data,
    totalPoops: Number(data.total_poops ?? data.totalPoops ?? 0),
    totalUsers: Number(data.total_users ?? data.totalUsers ?? 0),
    poopersWorldwide: Number(data.total_users ?? data.poopersWorldwide ?? 0),
    totalRooms: Number(data.total_rooms ?? data.totalRooms ?? 0),
    activeRooms: Number(data.total_rooms ?? data.activeRooms ?? 0),
    premiumRooms: Number(data.premium_rooms ?? data.premiumRooms ?? 0),
    poopsToday: Number(data.poops_today ?? data.poopsToday ?? 0)
  };
}

export default function PoopApp() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [lastUpdatedGroups, setLastUpdatedGroups] = useState<Group[] | null>(null);
  const [stats, setStats] = useState<any>(EMPTY_STATS);

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [profileOpen, setProfileOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [wrappedOpen, setWrappedOpen] = useState(false);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [celebrationData, setCelebrationData] = useState<CelebrationData | null>(null);
  const [infoType, setInfoType] = useState<InfoType>(null);
  const [initialGroupCode, setInitialGroupCode] = useState<string | null>(null);
  const [triggerCreateModal, setTriggerCreateModal] = useState(false);
  const [triggerJoinModal, setTriggerJoinModal] = useState(false);
  const [logging, setLogging] = useState(false);

  const loggingRef = useRef(false);

  const persistUser = useCallback((user: User | null) => {
    setCurrentUser(user);
    try {
      if (user) {
        localStorage.setItem('poop_user_id', user.id);
        localStorage.setItem('poop_user_profile', JSON.stringify(user));
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('poop_user_id');
        localStorage.removeItem('poop_user_profile');
        localStorage.removeItem('user');
      }
    } catch {}
  }, []);

  useEffect(() => {
    registerServiceWorker();
    radarAudio.preloadFart();

    const params = new URLSearchParams(window.location.search);
    const groupCode = params.get('group') || params.get('join');
    if (groupCode) setInitialGroupCode(groupCode);
    if (params.get('auth') === 'error') {
      showToast({
        type: 'error',
        title: 'No se pudo completar el acceso',
        description: 'Intenta iniciar sesión de nuevo.'
      });
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('auth');
        window.history.replaceState({}, '', url.toString());
      } catch {}
    }

    const supabase = getSupabase();

    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        persistUser(null);
        return;
      }

      try {
        const profile = await ensureProfile();
        if (profile?.user) {
          persistUser({ ...profile.user, isRegistered: true });
          if (getNotificationSettings().webPushEnabled) syncWebPushSubscription();
        }
      } catch (err) {
        console.warn('Could not load the Supabase profile:', err);
      }
    };

    loadProfile();

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session?.user) {
          persistUser(null);
          return;
        }

        // Defer Supabase queries so we never block the auth callback itself.
        setTimeout(async () => {
          try {
            const profile = await ensureProfile();
            if (profile?.user) {
              persistUser({ ...profile.user, isRegistered: true });
              if (getNotificationSettings().webPushEnabled) syncWebPushSubscription();
            }
          } catch (err) {
            console.warn('Could not load the Supabase profile:', err);
          }
        }, 0);
      }
    );

    const loadStats = async () => {
      const { data, error } = await supabase.from('app_stats').select('*').eq('id', 1).maybeSingle();
      if (!error && data) setStats(mapStats(data));
    };
    loadStats();

    const statsChannel = supabase
      .channel('poop-app-stats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_stats', filter: 'id=eq.1' },
        (payload) => {
          if (payload.new) setStats(mapStats(payload.new));
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('Stats realtime channel unavailable; using initial snapshot.');
        }
      });

    return () => {
      authSubscription.unsubscribe();
      supabase.removeChannel(statsChannel);
    };
  }, [persistUser]);

  // A push received while the app is open is shown silently by the service
  // worker; this plays the custom fart sound from the page instead.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'poop:push-received') {
        playNotificationSound('fart');
      } else if (event.data?.type === 'poop:push-subscription-change') {
        if (getNotificationSettings().webPushEnabled) syncWebPushSubscription();
      }
    };

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
  }, []);

  const handleAuthSuccess = (user: User) => {
    persistUser({ ...user, isRegistered: true });
    setAuthOpen(false);
    setProfileOpen(false);
    showToast({
      type: 'success',
      title: `¡Bienvenido, ${user.username}!`,
      description: 'Crea o únete a una sala privada para empezar a competir.',
      duration: 5000
    });
  };

  const handleLogout = async () => {
    try {
      await optOutWebPush();
    } catch {}
    try {
      await signOut();
    } catch {}
    persistUser(null);
    setActiveGroup(null);
    setUserGroups([]);
    setProfileOpen(false);
    try {
      localStorage.removeItem('poop_active_group_id');
    } catch {}
    showToast({ type: 'info', title: 'Sesión cerrada', description: 'Vuelve cuando quieras.' });
  };

  const handleUpdateUser = (user: User) => {
    persistUser(user);
  };

  const handleLogPoop = async () => {
    if (!currentUser) {
      setAuthMode('signup');
      setAuthOpen(true);
      return;
    }
    if (loggingRef.current) return;
    loggingRef.current = true;
    setLogging(true);
    playNotificationSound('fart');

    try {
      const data = await logPoop(
        activeGroup?.id || null,
        new Date().getTimezoneOffset()
      );

      if (data.user) persistUser(data.user);
      const updatedGroup = data.group;
      if (updatedGroup) {
        setActiveGroup(updatedGroup);
        setLastUpdatedGroups([updatedGroup]);
        setUserGroups((prev) => {
          const exists = prev.some((group) => group.id === updatedGroup.id);
          return exists
            ? prev.map((group) => (group.id === updatedGroup.id ? updatedGroup : group))
            : [updatedGroup, ...prev];
        });
      }

      playNotificationSound('fanfare');
      setCelebrationData({
        previousRank: Number(data.previousRank || 0),
        newRank: Number(data.newRank || 0),
        poopCount: Number(data.user?.totalPoops || currentUser.totalPoops + 1),
        username: data.user?.username || currentUser.username,
        isTopSpot: Boolean(data.groupInfo?.isGroupKing),
        streak: Number(data.user?.currentStreak || 0),
        groupInfo: data.groupInfo || null
      });
      setCelebrationOpen(true);
    } catch (err: any) {
      const details = err?.details || {};
      if (err?.code === 'COOLDOWN' || details.code === 'COOLDOWN') {
        const seconds = Math.max(1, Math.ceil(Number(details.retryAfterMs || 10000) / 1000));
        showToast({
          type: 'info',
          title: 'Tranquilo, campeón',
          description: `Espera ${seconds} segundo${seconds === 1 ? '' : 's'} antes de volver a registrar.`,
          duration: 4000
        });
      } else {
        showToast({
          type: 'error',
          title: 'No se pudo registrar',
          description: err?.message || 'Intenta de nuevo en unos segundos.'
        });
      }
    } finally {
      loggingRef.current = false;
      setLogging(false);
    }
  };

  const scrollToGroups = () => {
    document.getElementById('groups-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#0f0f11] transition-colors">
      <OfflineIndicator />
      <ToastHost />
      <RoomNotifications userId={currentUser?.id || null} />

      <Navbar
        currentUser={currentUser}
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setAuthOpen(true);
        }}
        onOpenProfile={() => setProfileOpen(true)}
        onLogout={handleLogout}
        onOpenModal={(modal) => {
          if (modal === 'how-it-works') setHowItWorksOpen(true);
          else if (modal === 'faq') setInfoType('faq');
        }}
        onOpenLeaderboard={scrollToGroups}
        onOpenGroups={scrollToGroups}
        onOpenWrapped={() => setWrappedOpen(true)}
        onOpenPaymentModal={handleLogPoop}
      />

      <main className="max-w-7xl 2xl:max-w-[1480px] mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
        <Hero
          currentUser={currentUser}
          activeGroup={activeGroup}
          userGroups={userGroups}
          onSelectGroup={(group) => {
            if (group) {
              setActiveGroup(group);
              try {
                localStorage.setItem('poop_active_group_id', group.id);
              } catch {}
            }
          }}
          onCreateGroup={() => {
            if (!currentUser) {
              setAuthMode('signup');
              setAuthOpen(true);
            } else {
              setTriggerCreateModal(true);
            }
          }}
          onJoinGroup={() => {
            if (!currentUser) {
              setAuthMode('signup');
              setAuthOpen(true);
            } else {
              setTriggerJoinModal(true);
            }
          }}
          onOpenPaymentModal={handleLogPoop}
          onLogPoop={handleLogPoop}
          onOpenHowItWorks={() => setHowItWorksOpen(true)}
          onOpenGroups={scrollToGroups}
        />

        <FeatureCards stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          <div className="lg:col-span-2 space-y-4 sm:space-y-5">
            <GroupsSection
              currentUser={currentUser}
              onOpenAuth={(mode) => {
                setAuthMode(mode);
                setAuthOpen(true);
              }}
              onLogPoop={handleLogPoop}
              activeGroup={activeGroup}
              initialGroupCode={initialGroupCode}
              onClearInitialGroupCode={() => {
                setInitialGroupCode(null);
                try {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('group');
                  url.searchParams.delete('join');
                  window.history.replaceState({}, '', url.toString());
                } catch {}
              }}
              onActiveGroupChange={(group) => setActiveGroup(group)}
              onGroupsChange={(groups) => setUserGroups(groups)}
              lastUpdatedGroups={lastUpdatedGroups}
              triggerCreateModal={triggerCreateModal}
              onResetTriggerCreateModal={() => setTriggerCreateModal(false)}
              triggerJoinModal={triggerJoinModal}
              onResetTriggerJoinModal={() => setTriggerJoinModal(false)}
            />
          </div>
          <div className="space-y-4 sm:space-y-5">
            <StreakCard currentUser={currentUser} />
            <ShareRankCard
              currentUser={currentUser}
              activeGroup={activeGroup}
              onOpenWrapped={(platform) => {
                if (platform) setWrappedOpen(true);
                else setShareOpen(true);
              }}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-amber-200/80 dark:border-amber-900/40 bg-gradient-to-r from-amber-50 via-white to-amber-50 dark:from-amber-950/20 dark:via-[#18181b] dark:to-amber-950/20 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-neutral-950 dark:text-white">
              {currentUser
                ? `Llevas ${currentUser.totalPoops || 0} popós registrados.`
                : 'Registrar un popó siempre es gratis.'}
            </p>
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-0.5">
              Sin monedas, sin packs y sin pagar por cada popó. Solo salas privadas.
            </p>
          </div>
          <button
            onClick={handleLogPoop}
            disabled={logging}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-95 disabled:opacity-60 text-neutral-950 font-black text-sm shadow-md shadow-amber-500/20 transition-all"
          >
            {logging ? 'Registrando...' : '¡ACABO DE CAGAR! +1'}
          </button>
        </div>

        <Footer
          onOpenInfo={(type) => setInfoType(type)}
          onOpenHowItWorks={() => setHowItWorksOpen(true)}
        />
      </main>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
        onAuthSuccess={handleAuthSuccess}
      />

      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        currentUser={currentUser}
        onUpdateUser={handleUpdateUser}
        onOpenPaymentModal={handleLogPoop}
        onOpenWrapped={() => setWrappedOpen(true)}
        onLogout={handleLogout}
      />

      <HowItWorksModal
        isOpen={howItWorksOpen}
        onClose={() => setHowItWorksOpen(false)}
        onOpenPaymentModal={handleLogPoop}
        onLogPoop={handleLogPoop}
        onOpenLeaderboard={scrollToGroups}
      />

      <InfoModal type={infoType} onClose={() => setInfoType(null)} />

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        currentUser={currentUser}
        onOpenWrapped={() => {
          setShareOpen(false);
          setWrappedOpen(true);
        }}
      />

      <WrappedModal
        isOpen={wrappedOpen}
        onClose={() => setWrappedOpen(false)}
        currentUser={currentUser}
        onOpenPaymentModal={() => {}}
      />

      <CelebrationModal
        isOpen={celebrationOpen}
        data={celebrationData}
        onClose={() => setCelebrationOpen(false)}
        onOpenShareModal={() => {
          setCelebrationOpen(false);
          setShareOpen(true);
        }}
        onOpenStoryCard={() => {
          setCelebrationOpen(false);
          setWrappedOpen(true);
        }}
        onViewLeaderboard={() => {
          setCelebrationOpen(false);
          scrollToGroups();
        }}
      />

      <CookieBanner onOpenPrivacy={() => setInfoType('privacy')} />
    </div>
  );
}
