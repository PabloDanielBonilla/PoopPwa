import React, { useState, useEffect } from 'react';
import { User as UserIcon, Menu, X, Globe, Sparkles, Swords, LogOut, Moon, Sun, Coins, Zap, Users, Bell, BellRing, Smartphone, Loader2, Send } from 'lucide-react';
import { User } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { PWAInstallButton } from './PWAInstallButton';
import { requestWebPushPermission, showToast } from '../utils/notificationService';
import { sendDemoPush } from '../lib/api';

interface NavbarProps {
  currentUser: User | null;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  onOpenModal?: (modalName: string) => void;
  onOpenLeaderboard?: () => void;
  onOpenGroups?: () => void;
  onOpenWrapped?: () => void;
  onOpenPaymentModal?: () => void;
}


export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onLogout,
  onOpenModal,
  onOpenLeaderboard,
  onOpenGroups,
  onOpenWrapped,
  onOpenPaymentModal,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pushStatus, setPushStatus] = useState<NotificationPermission | 'unsupported'>('default');
  const [isTestingPush, setIsTestingPush] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushStatus(Notification.permission);
    } else {
      setPushStatus('unsupported');
    }

    const onUpdate = () => {
      if ('Notification' in window) setPushStatus(Notification.permission);
    };
    window.addEventListener('poop:notification-settings-updated', onUpdate);
    return () => window.removeEventListener('poop:notification-settings-updated', onUpdate);
  }, []);

  const handleToggleNotifications = async () => {
    const granted = await requestWebPushPermission();
    if (granted) {
      setPushStatus('granted');
      showToast({
        type: 'success',
        title: t('Alerts Active!', '¡Alertas Activadas!'),
        description: t(
          'Te avisaremos al instante cuando alguien de tu sala anote o te quite el 1.º lugar.',
          'Te avisaremos al instante cuando alguien de tu sala anote o te quite el 1.º lugar.'
        )
      });
    } else {
      showToast({
        type: 'info',
        title: t('Permiso requerido', 'Permiso requerido'),
        description: t(
          'Para recibir alertas cuando te quiten el 1.º lugar, activa las notificaciones en tu navegador.',
          'Para recibir alertas cuando te quiten el 1.º lugar, activa las notificaciones en tu navegador.'
        )
      });
    }
  };

  const handleTestPush = async () => {
    if (!currentUser) {
      onOpenAuth('login');
      return;
    }
    if (isTestingPush) return;

    setIsTestingPush(true);
    try {
      const granted = await requestWebPushPermission(currentUser.id);

      if (!granted) {
        showToast({
          type: 'info',
          title: t('Push not available', 'Push no disponible'),
          description: t(
            'Activa las notificaciones en un navegador compatible y prueba desde la web publicada en HTTPS.',
            'Activa las notificaciones en un navegador compatible y prueba desde la web publicada en HTTPS.'
          ),
        });
        return;
      }

      setPushStatus('granted');
      const result = await sendDemoPush();

      if (result.sent > 0) {
        showToast({
          type: 'success',
          title: t('Test notification sent', 'Notificación de prueba enviada'),
          description: t(
            'Revisa la barra de notificaciones de tu celular.',
            'Revisa la barra de notificaciones de tu celular.'
          ),
        });
      } else {
        showToast({
          type: 'info',
          title: t('No push subscription found', 'No encontramos una suscripción push'),
          description: t(
            'Activa las notificaciones de nuevo en este dispositivo e inténtalo otra vez.',
            'Activa las notificaciones de nuevo en este dispositivo e inténtalo otra vez.'
          ),
        });
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: t('Could not send the test', 'No se pudo enviar la prueba'),
        description:
          error?.message ||
          t('Check the push configuration and try again.', 'Revisa la configuración de push e inténtalo de nuevo.'),
      });
    } finally {
      setIsTestingPush(false);
    }
  };

  return (
    <header className="w-full bg-white/95 dark:bg-[#121215]/95 backdrop-blur-md sticky top-0 z-40 border-b border-neutral-100 dark:border-neutral-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        
        {/* Left: Brand Logo matching mockup (poop.lol) */}
        <div 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2 cursor-pointer select-none group shrink-0"
        >
          <span className="text-xl sm:text-2xl font-black tracking-tight text-neutral-950 dark:text-white">
            poop.lol
          </span>
        </div>

        {/* Center / Right Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4 text-sm font-semibold text-neutral-600 dark:text-neutral-300">
          <button
            onClick={() => onOpenModal?.('how-it-works')}
            className="hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer"
          >
            {t('How it works', 'Cómo funciona')}
          </button>

          <button
            onClick={() => onOpenModal?.('faq')}
            className="hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer"
          >
            FAQ
          </button>

          {/* Push Notification Toggle Bell */}
          <button
            type="button"
            onClick={handleToggleNotifications}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all cursor-pointer border ${
              pushStatus === 'granted'
                ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400'
                : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-amber-500'
            }`}
            title={
              pushStatus === 'granted'
                ? t('Alerts Active (Rooms & Dethrone)', 'Alertas activas (Salas y Destronamiento)')
                : t('Enable alerts when a friend scores or takes #1', 'Activar alertas de salas y destronamiento')
            }
          >
            {pushStatus === 'granted' ? (
              <BellRing className="w-4 h-4 text-amber-500" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
          </button>

          {/* Send a real push notification to this account's devices */}
          <button
            type="button"
            onClick={handleTestPush}
            disabled={isTestingPush}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-amber-500 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            title={t('Send a test push to my devices', 'Enviar un push de prueba a mis dispositivos')}
          >
            {isTestingPush ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>

          {/* Theme Toggle Pill */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-amber-400 transition-all cursor-pointer border border-neutral-200 dark:border-neutral-700"
            title={theme === 'dark' ? t('Switch to Light Mode', 'Cambiar a Modo Claro') : t('Switch to Dark Mode', 'Cambiar a Modo Oscuro')}
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-700" />
            )}
          </button>

          {/* Language Switcher Pill */}
          <button
            onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-all cursor-pointer border border-neutral-200 dark:border-neutral-700"
            title={t('Switch to Spanish / English', 'Cambiar Idioma')}
          >
            {language === 'es' ? (
              <>
                <svg className="w-4 h-3 rounded-2xs overflow-hidden shrink-0" viewBox="0 0 750 500">
                  <rect width="750" height="500" fill="#c60b1e"/>
                  <rect y="125" width="750" height="250" fill="#ffc400"/>
                </svg>
                <span>ES</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-3 rounded-2xs overflow-hidden shrink-0" viewBox="0 0 650 390">
                  <rect width="650" height="390" fill="#b22234"/>
                  <path d="M0,30H650M0,90H650M0,150H650M0,210H650M0,270H650M0,330H650" stroke="#fff" strokeWidth="30"/>
                  <rect width="260" height="210" fill="#3c3b6e"/>
                </svg>
                <span>EN</span>
              </>
            )}
          </button>

          {/* PWA Install Button (1-tap home screen install) */}
          <PWAInstallButton variant="navbar" />

          <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700 mx-0.5"></div>

          {currentUser ? (
            <button
              onClick={onOpenProfile}
              className="inline-flex items-center gap-2 py-1.5 px-3 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95 text-neutral-900 dark:text-neutral-100 font-bold transition-all border border-neutral-200 dark:border-neutral-700 cursor-pointer shadow-xs"
              title={t('View Profile Settings & Log Out', 'Ver Perfil y Cerrar Sesión')}
            >
              <UserIcon className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
              <span className="max-w-[110px] truncate text-xs">{currentUser.username}</span>
              <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-black px-1.5 py-0.5 rounded-full border border-amber-300/40 dark:border-amber-700/50">
                {currentUser.totalPoops}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onOpenAuth('login')}
                className="text-neutral-900 dark:text-neutral-200 font-bold hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer px-3 py-1.5"
              >
                {t('Log in', 'Iniciar sesión')}
              </button>
              <button
                onClick={() => onOpenAuth('signup')}
                className="bg-[#facc15] hover:bg-[#eab308] active:scale-95 text-neutral-950 font-black text-xs px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer border border-amber-400/40"
              >
                {t('Sign up', 'Registrarse')}
              </button>
            </div>
          )}
        </nav>

        {/* Mobile Hamburger Toggle & Actions */}
        <div className="flex items-center md:hidden gap-1 sm:gap-2 min-w-0">
          {/* Universal Mobile PWA Install Button. On small phones it lives in
              the drawer so the hamburger and profile always stay visible. */}
          <div className="hidden sm:flex shrink-0">
            <PWAInstallButton variant="mobile-pill" />
          </div>

          {/* Mobile Push Toggle Bell */}
          <button
            type="button"
            onClick={handleToggleNotifications}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
              pushStatus === 'granted'
                ? 'text-amber-500'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
            title="Alertas"
          >
            {pushStatus === 'granted' ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
          </button>

          {/* Mobile Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-neutral-700 dark:text-amber-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          {currentUser && (
            <button
              onClick={onOpenProfile}
              className="px-2 sm:px-2.5 py-1 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700/60 rounded-full text-xs font-black text-amber-950 dark:text-amber-300 flex items-center gap-1.5 cursor-pointer max-w-[90px] sm:max-w-[140px] min-w-0 shrink shadow-2xs"
            >
              <span className="truncate text-xs font-bold">{currentUser.username}</span>
              <span className="text-[10px] bg-amber-300 dark:bg-amber-800 text-amber-950 dark:text-amber-100 px-1.5 py-0.2 rounded-full shrink-0">
                {currentUser.totalPoops}
              </span>
            </button>
          )}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-[#18181b] px-4 py-4 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-150 text-neutral-900 dark:text-neutral-100">
          <PWAInstallButton variant="banner" />

          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              void handleTestPush();
            }}
            disabled={isTestingPush}
            className="w-full text-left py-2.5 px-3 rounded-xl text-sm font-black text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
          >
            <span className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{t('Test push notification', 'Probar notificación push')}</span>
            </span>
            {isTestingPush ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            ) : (
              <Send className="w-4 h-4 text-neutral-400" />
            )}
          </button>
          <p className="px-1 text-[10px] leading-snug font-semibold text-neutral-500 dark:text-neutral-400">
            {t(
              'Works on the published HTTPS site. On iPhone, install the app first.',
              'Funciona en la web publicada con HTTPS. En iPhone, instala la app primero.'
            )}
          </p>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenPaymentModal?.();
            }}
            className="w-full text-left py-2 px-3 rounded-lg text-sm font-black text-amber-950 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700/60 flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              {t('Log Poop', 'Registrar Popó')}
            </span>
          </button>
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenModal?.('how-it-works');
            }}
            className="w-full text-left py-2 px-3 rounded-lg text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
          >
            {t('How it works', 'Cómo funciona')}
          </button>
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              if (onOpenGroups) {
                onOpenGroups();
              } else {
                document.getElementById('groups-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="w-full text-left py-2.5 px-3 rounded-xl text-sm font-black text-amber-950 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-700/60 flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{t('Private Rooms (Friends & Work)', 'Salas Privadas (Amigos & Trabajo)')}</span>
            </span>
            <span className="text-[10px] bg-amber-400 text-neutral-950 font-black px-1.5 py-0.2 rounded-full uppercase">
              {t('CORE', 'TOP')}
            </span>
          </button>
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenModal?.('faq');
            }}
            className="w-full text-left py-2 px-3 rounded-lg text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
          >
            {t('FAQ', 'Preguntas Frecuentes')}
          </button>
          {onOpenWrapped && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenWrapped();
              }}
              className="w-full text-left py-2 px-3 rounded-lg text-sm font-black text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-transparent dark:border-amber-700/50 flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                {t('My Poop Wrapped 2026', 'Mi Poop Wrapped 2026')}
              </span>
              <span className="text-[10px] bg-amber-400 text-neutral-950 font-black px-1.5 py-0.5 rounded-full uppercase">
                {t('NEW', 'NUEVO')}
              </span>
            </button>
          )}
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            {currentUser ? (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenProfile();
                }}
                className="w-full text-xs font-bold text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 py-2.5 px-3.5 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
              >
                <UserIcon className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                <span className="truncate">{currentUser.username}</span>
                <span className="text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-200 font-black px-2 py-0.5 rounded-full ml-auto shrink-0">
                  {currentUser.totalPoops}
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-normal shrink-0 ml-1">
                  ({t('Profile', 'Perfil')})
                </span>
              </button>
            ) : (
              <div className="w-full grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAuth('login');
                  }}
                  className="w-full py-2 text-center text-xs font-bold text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 rounded-lg cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700"
                >
                  {t('Log in', 'Iniciar sesión')}
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAuth('signup');
                  }}
                  className="w-full py-2 text-center text-xs font-black text-neutral-950 bg-[#facc15] hover:bg-[#eab308] rounded-lg shadow-xs cursor-pointer"
                >
                  {t('Sign up', 'Registrarse')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

