import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { 
  Download, 
  Smartphone, 
  Share, 
  PlusSquare, 
  X, 
  CheckCircle2, 
  Sparkles, 
  MoreVertical, 
  Monitor,
  Copy,
  Check,
  ExternalLink,
  Apple,
  Bot
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { showToast } from '../utils/notificationService';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'mobile-pill' | 'banner' | 'hero' | 'floating';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'navbar', className = '' }) => {
  const { 
    canPromptNative, 
    isInstalled, 
    isIOS, 
    isAndroid, 
    isDesktop, 
    browserType, 
    install 
  } = usePWAInstall();

  const [showGuideModal, setShowGuideModal] = useState(false);
  const [selectedGuideTab, setSelectedGuideTab] = useState<'ios' | 'android' | 'desktop'>('ios');
  const [isDismissed, setIsDismissed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const { t, language } = useLanguage();

  // Initialize guide tab based on detected platform
  useEffect(() => {
    if (isIOS) setSelectedGuideTab('ios');
    else if (isAndroid) setSelectedGuideTab('android');
    else setSelectedGuideTab('desktop');
  }, [isIOS, isAndroid]);

  // If already running inside standalone app, do not show install CTA
  if (isInstalled) {
    if (variant === 'navbar') {
      return (
        <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>App Instalada</span>
        </span>
      );
    }
    return null;
  }

  if (isDismissed && variant === 'banner') {
    return null;
  }

  const handleInstallClick = async () => {
    if (canPromptNative) {
      const succeeded = await install();
      if (!succeeded) {
        // Fallback to guided modal if dismissed or error
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  const handleCopyAppUrl = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast({
      type: 'success',
      title: t('Link Copied!', '¡Enlace Copiado!'),
      description: t('Open this link in Safari or Chrome to install.', 'Abre este enlace en Safari o Chrome para instalar.'),
      duration: 3000
    });
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <>
      {/* Mobile Top Navbar Pill */}
      {variant === 'mobile-pill' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-neutral-950 font-black text-xs shadow-xs transition-transform cursor-pointer hover:scale-105 active:scale-95 border border-amber-500/30 ${className}`}
          title={t('Install app on home screen', 'Instalar app en pantalla de inicio')}
        >
          <Smartphone className="w-3.5 h-3.5 text-neutral-950" />
          <span className="font-extrabold">{t('Instalar', 'Instalar')}</span>
        </button>
      )}

      {/* Desktop Navbar Button */}
      {variant === 'navbar' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`relative group inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 active:scale-95 text-neutral-950 font-black text-xs shadow-xs hover:shadow transition-all cursor-pointer ${className}`}
          title={t('Install on your phone home screen for 1-tap logging', 'Instala la app en tu pantalla de inicio para registrar con 1 toque')}
        >
          <Smartphone className="w-3.5 h-3.5 text-neutral-950 fill-neutral-950/20" />
          <span className="font-extrabold">{t('Instalar App', 'Instalar App')}</span>
          <span className="hidden sm:inline-block px-1 py-0.2 rounded bg-neutral-950/15 text-[9px] uppercase font-black text-neutral-950">
            1 toque
          </span>
        </button>
      )}

      {/* Hero Section CTA Button */}
      {variant === 'hero' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-100/80 dark:bg-amber-950/40 hover:bg-amber-200/80 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-700/60 text-amber-950 dark:text-amber-200 text-xs font-black transition-all shadow-xs cursor-pointer hover:scale-102 active:scale-98 ${className}`}
        >
          <Download className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>{t('Instalar en pantalla de inicio (1 toque)', 'Instalar en pantalla de inicio (1 toque)')}</span>
        </button>
      )}

      {/* Banner Variant */}
      {variant === 'banner' && (
        <div className={`p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-amber-500/15 border border-amber-400/40 flex items-center justify-between gap-3 shadow-xs ${className}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-neutral-950 flex items-center justify-center font-black shrink-0 shadow-xs">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-neutral-900 dark:text-white leading-tight truncate">
                {t('¿Quieres registrar en 1 solo toque?', '¿Quieres registrar en 1 solo toque?')}
              </p>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-snug">
                {t('Instala la app en tu móvil como app nativa.', 'Instala la app en tu móvil como app nativa.')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-neutral-950 font-black text-xs shadow-xs transition-transform cursor-pointer hover:scale-105 active:scale-95"
            >
              {t('Instalar', 'Instalar')}
            </button>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Universal Interactive PWA Installation Guide Modal for ALL browsers */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200 select-none overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#18181b] p-5 sm:p-6 shadow-2xl border-2 border-amber-300 dark:border-amber-700/60 text-neutral-900 dark:text-white relative max-h-[92vh] overflow-y-auto my-auto animate-in zoom-in-95 duration-200">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer z-10"
              aria-label="Cerrar guía"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4 pr-8">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-neutral-950 flex items-center justify-center font-black shadow-md shrink-0">
                <img src="/pwa-192x192.png" alt="poop.lol" className="w-10 h-10 rounded-xl object-contain" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-black leading-tight text-neutral-950 dark:text-white">
                  {t('Instalar poop.lol en tu Dispositivo', 'Instalar poop.lol en tu Dispositivo')}
                </h3>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-extrabold mt-0.5">
                  {t('Acceso directo en 1 toque y pantalla completa', 'Acceso directo en 1 toque y pantalla completa')}
                </p>
              </div>
            </div>

            {/* Platform Selection Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-2xl mb-4 text-xs font-black">
              <button
                type="button"
                onClick={() => setSelectedGuideTab('ios')}
                className={`py-2 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedGuideTab === 'ios'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-amber-400 shadow-xs border border-neutral-200 dark:border-neutral-700'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Apple className="w-4 h-4" />
                <span>iPhone / iPad</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedGuideTab('android')}
                className={`py-2 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedGuideTab === 'android'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-amber-400 shadow-xs border border-neutral-200 dark:border-neutral-700'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Bot className="w-4 h-4" />
                <span>Android</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedGuideTab('desktop')}
                className={`py-2 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedGuideTab === 'desktop'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-amber-400 shadow-xs border border-neutral-200 dark:border-neutral-700'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>PC / Mac</span>
              </button>
            </div>

            {/* TAB 1: iOS (iPhone / iPad - Safari & Chrome) */}
            {selectedGuideTab === 'ios' && (
              <div className="space-y-3 mb-5 animate-in fade-in duration-150">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 shrink-0">
                    <Share className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <strong className="block font-black text-neutral-900 dark:text-white mb-0.5">
                      1. {t('Toca el botón Compartir', 'Toca el botón Compartir')}
                    </strong>
                    <span className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {t(
                        'En Safari pulsa el icono cuadrado con la flecha hacia arriba (⎋) en la barra inferior.',
                        'En Safari pulsa el icono cuadrado con la flecha hacia arriba (⎋) en la barra inferior.'
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <strong className="block font-black text-neutral-900 dark:text-white mb-0.5">
                      2. {t('Selecciona "Agregar a pantalla de inicio"', 'Selecciona "Agregar a pantalla de inicio"')}
                    </strong>
                    <span className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {t(
                        'Desliza un poco hacia abajo en el menú y toca "Agregar a la pantalla de inicio" (o "Add to Home Screen").',
                        'Desliza un poco hacia abajo en el menú y toca "Agregar a la pantalla de inicio" (o "Add to Home Screen").'
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-400/40">
                  <div className="p-2 rounded-xl bg-amber-400 text-neutral-950 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <strong className="block font-black text-amber-800 dark:text-amber-300 mb-0.5">
                      3. {t('Toca "Agregar" arriba a la derecha', 'Toca "Agregar" arriba a la derecha')}
                    </strong>
                    <span className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {t(
                        '¡Listo! La app se guardará en tu inicio. Ábrela desde ahí para registrar tus idas al baño en 1 solo toque.',
                        '¡Listo! La app se guardará en tu inicio. Ábrela desde ahí para registrar tus idas al baño en 1 solo toque.'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Android (Chrome, Samsung Internet, Firefox) */}
            {selectedGuideTab === 'android' && (
              <div className="space-y-3 mb-5 animate-in fade-in duration-150">
                {canPromptNative && (
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      {t('Tu navegador soporta instalación directa:', 'Tu navegador soporta instalación directa:')}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await install();
                        if (ok) setShowGuideModal(false);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white font-black text-xs hover:bg-emerald-600 transition cursor-pointer"
                    >
                      {t('Instalar Ahora', 'Instalar Ahora')}
                    </button>
                  </div>
                )}

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <strong className="block font-black text-neutral-900 dark:text-white mb-0.5">
                      1. {t('Abre el menú de opciones (⋮)', 'Abre el menú de opciones (⋮)')}
                    </strong>
                    <span className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {t(
                        'Toca los tres puntos (⋮) en la esquina superior derecha de Google Chrome o Samsung Internet.',
                        'Toca los tres puntos (⋮) en la esquina superior derecha de Google Chrome o Samsung Internet.'
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <strong className="block font-black text-neutral-900 dark:text-white mb-0.5">
                      2. {t('Toca "Instalar app" o "Agregar a pantalla principal"', 'Toca "Instalar app" o "Agregar a pantalla principal"')}
                    </strong>
                    <span className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {t(
                        'Selecciona la opción "Instalar aplicación" o "Agregar a la pantalla principal".',
                        'Selecciona la opción "Instalar aplicación" o "Agregar a la pantalla principal".'
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-400/40">
                  <div className="p-2 rounded-xl bg-amber-400 text-neutral-950 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <strong className="block font-black text-amber-800 dark:text-amber-300 mb-0.5">
                      3. {t('Confirma la instalación', 'Confirma la instalación')}
                    </strong>
                    <span className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {t(
                        'La app quedará en tu cajón de aplicaciones y pantalla de inicio para un registro ultra rápido.',
                        'La app quedará en tu cajón de aplicaciones y pantalla de inicio para un registro ultra rápido.'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Desktop (Chrome, Edge, Mac, Windows) */}
            {selectedGuideTab === 'desktop' && (
              <div className="space-y-3 mb-5 animate-in fade-in duration-150">
                {canPromptNative && (
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      {t('Instalación en 1 clic disponible:', 'Instalación en 1 clic disponible:')}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await install();
                        if (ok) setShowGuideModal(false);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white font-black text-xs hover:bg-emerald-600 transition cursor-pointer"
                    >
                      {t('Instalar Ahora', 'Instalar Ahora')}
                    </button>
                  </div>
                )}

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 shrink-0">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <strong className="block font-black text-neutral-900 dark:text-white mb-0.5">
                      1. {t('Barra de direcciones (URL)', 'Barra de direcciones (URL)')}
                    </strong>
                    <span className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {t(
                        'En Chrome o Microsoft Edge, busca el icono de instalar (⊕ o pantalla con flecha) en el lado derecho de la barra de direcciones.',
                        'En Chrome o Microsoft Edge, busca el icono de instalar (⊕ o pantalla con flecha) en el lado derecho de la barra de direcciones.'
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <strong className="block font-black text-neutral-900 dark:text-white mb-0.5">
                      2. {t('Haz clic en "Instalar poop.lol"', 'Haz clic en "Instalar poop.lol"')}
                    </strong>
                    <span className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {t(
                        'También puedes ir a Menú (tres puntos ⋮) > "Transmitir, guardar y compartir" o "Aplicaciones" > "Instalar este sitio como aplicación".',
                        'También puedes ir a Menú (tres puntos ⋮) > "Transmitir, guardar y compartir" o "Aplicaciones" > "Instalar este sitio como aplicación".'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Actions: Copy Link & Close */}
            <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={handleCopyAppUrl}
                className="w-full py-2.5 px-3 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>{t('¡Enlace copiado!', '¡Enlace copiado!')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-neutral-500" />
                    <span>{t('Copiar enlace para abrir en otro navegador', 'Copiar enlace para abrir en otro navegador')}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-full py-3 rounded-2xl bg-neutral-950 hover:bg-neutral-900 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-neutral-950 text-xs font-black transition cursor-pointer shadow-md"
              >
                {t('Entendido, ¡voy a instalarla!', 'Entendido, ¡voy a instalarla!')}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
