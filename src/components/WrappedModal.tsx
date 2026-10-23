import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Download,
  Share2,
  Image as ImageIcon,
  Loader2,
  Globe,
  Flame,
  Swords,
  Crown,
  Sparkles,
  Zap,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { toBlob, toPng } from 'html-to-image';
import { User } from '../types';
import { WhatsAppIcon, InstagramIcon, FacebookIcon, XIcon } from './SocialIcons';
import { useLanguage } from '../context/LanguageContext';
import { showToast } from '../utils/notificationService';
import { safeOpenUrl } from '../utils/safeOpen';
import { getUserPhoto } from '../utils/avatarUtils';
import { renderBrandLogo } from './BrandLogos';
import { CountryFlag } from './CountryFlag';

interface WrappedModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onOpenPaymentModal?: () => void;
  autoSharePlatform?: 'whatsapp' | null;
}

export const WrappedModal: React.FC<WrappedModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  autoSharePlatform = null,
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const cachedBlobRef = useRef<Blob | null>(null);
  const cachedFileRef = useRef<File | null>(null);

  const username = currentUser?.username || 'Competidor';
  const cleanUserSlug = username.toLowerCase().replace(/[^a-z0-9]/g, '');
  const totalPoops = currentUser?.totalPoops ?? 0;
  const streak = currentUser?.currentStreak ?? 0;

  const shareUrl = currentUser ? `https://poop.lol/u/${cleanUserSlug || 'rank'}` : 'https://poop.lol';
  const shareText = t(
    `I've logged ${totalPoops.toLocaleString()} poops on poop.lol! Create a private room with me and let's see who poops more:`,
    `¡Llevo ${totalPoops.toLocaleString()} popós registrados en poop.lol! Crea una sala privada conmigo y veamos quién va más al baño:`
  );

  // Generate HD PNG Blob in background
  const generateCardBlob = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    try {
      const blob = await toBlob(cardRef.current, {
        pixelRatio: 2.5,
        quality: 0.98,
        backgroundColor: '#FAF9F5',
        skipFonts: true,
      });
      if (blob) {
        cachedBlobRef.current = blob;
        cachedFileRef.current = new File([blob], `poop-record-${cleanUserSlug || 'card'}.png`, { type: 'image/png' });
      }
      return blob;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      cachedBlobRef.current = null;
      cachedFileRef.current = null;
      setCopied(false);
      setCopiedImage(false);

      let isCancelled = false;
      const timer = setTimeout(async () => {
        if (!isCancelled) {
          await generateCardBlob();
          if (autoSharePlatform === 'whatsapp') {
            handleShareToPlatform('whatsapp');
          }
        }
      }, 300);
      return () => {
        isCancelled = true;
        clearTimeout(timer);
      };
    }
  }, [isOpen, username, totalPoops, streak, autoSharePlatform]);

  // Download HD Image to Device
  const handleDownloadPNG = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const blob = cachedBlobRef.current || await generateCardBlob();
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `poop-record-${cleanUserSlug || 'card'}.png`;
        link.href = url;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        showToast({
          type: 'success',
          title: t('Card Saved!', '¡Tarjeta Descargada!'),
          description: t('HD photo saved to your device. Ready to post or send with your link.', 'Foto HD guardada en tu dispositivo. Lista para publicar con tu enlace.'),
          duration: 4000
        });
        return;
      }

      const dataUrl = await toPng(cardRef.current, { 
        pixelRatio: 2, 
        quality: 0.98,
        backgroundColor: '#FAF9F5',
        skipFonts: true,
      });
      const link = document.createElement('a');
      link.download = `poop-record-${cleanUserSlug || 'card'}.png`;
      link.href = dataUrl;
      link.click();
      showToast({
        type: 'success',
        title: t('Card Saved!', '¡Tarjeta Descargada!'),
        description: t('HD photo saved to your device. Ready to post or send with your link.', 'Foto HD guardada en tu dispositivo. Lista para publicar con tu enlace.'),
        duration: 4000
      });
    } catch {
      // Graceful fallback
    } finally {
      setTimeout(() => setIsGenerating(false), 50);
    }
  };

  // Copy Image to Clipboard
  const handleCopyImageToClipboard = async () => {
    setIsGenerating(true);
    try {
      const blob = cachedBlobRef.current || await generateCardBlob();
      if (blob && navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopiedImage(true);
        showToast({
          type: 'success',
          title: t('Image Copied!', '¡Imagen Copiada!'),
          description: t('Paste it directly (Ctrl+V / Paste) into any chat or post.', 'Dale Pegar (Ctrl+V o Mantener presionado) en cualquier chat para enviarla.'),
          duration: 4500
        });
        setTimeout(() => setCopiedImage(false), 3000);
      } else {
        await handleDownloadPNG();
      }
    } catch {
      await handleDownloadPNG();
    } finally {
      setTimeout(() => setIsGenerating(false), 50);
    }
  };

  // Universal Social Share Handler: Downloads photo + opens external link/platform
  const handleShareToPlatform = async (platform: 'whatsapp' | 'instagram' | 'facebook' | 'twitter' | 'native') => {
    setIsGenerating(true);
    try {
      // 1. Always auto-download the HD PNG image first
      await handleDownloadPNG();

      const fullMessage = `${shareText}\n${shareUrl}`;
      const blob = cachedBlobRef.current || await generateCardBlob();
      let file = cachedFileRef.current;
      if (blob && !file) {
        file = new File([blob], `poop-lol-record-${cleanUserSlug || 'card'}.png`, { type: 'image/png' });
      }

      // 2. Native Share API (if requested or on mobile)
      if (platform === 'native') {
        if (file && typeof navigator.share === 'function') {
          try {
            if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: `poop.lol Record - ${totalPoops} Poops`,
                text: fullMessage,
                files: [file],
              });
              return;
            }
          } catch (e: any) {
            if (e?.name === 'AbortError') return;
          }
        }
        // Fallback to text share
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'poop.lol Record',
              text: fullMessage,
              url: shareUrl
            });
            return;
          } catch {}
        }
      }

      // Copy text to clipboard so it's ready to paste
      try {
        await navigator.clipboard.writeText(fullMessage);
      } catch {}

      // 3. Platform specific redirects
      if (platform === 'whatsapp') {
        showToast({
          type: 'success',
          title: t('Opening WhatsApp!', '¡Abriendo WhatsApp!'),
          description: t('Photo downloaded! Send the message and your link will be clickable.', '¡Foto descargada! Envía el mensaje para que tus amigos toquen el link directo.'),
          duration: 4500
        });
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullMessage)}`;
        safeOpenUrl(url);
      } else if (platform === 'instagram') {
        showToast({
          type: 'success',
          title: t('Photo Ready for Instagram!', '¡Foto Lista para Instagram!'),
          description: t('Photo downloaded & text copied! Add the photo to your Story or Post and paste the link.', '¡Foto descargada y texto copiado! Sube la foto a tu Historia y pega el link para que entren directo.'),
          duration: 5500
        });
        safeOpenUrl('https://instagram.com');
      } else if (platform === 'facebook') {
        showToast({
          type: 'success',
          title: t('Opening Facebook!', '¡Abriendo Facebook!'),
          description: t('Photo downloaded! Upload it with your challenge link.', '¡Foto descargada! Súbela junto con tu link de desafío.'),
          duration: 4500
        });
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        safeOpenUrl(fbUrl);
      } else if (platform === 'twitter') {
        showToast({
          type: 'success',
          title: t('Opening X / Twitter!', '¡Abriendo X / Twitter!'),
          description: t('Photo downloaded! Tweet with your direct link.', '¡Foto descargada! Publica tu tweet con tu link.'),
          duration: 4500
        });
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        safeOpenUrl(twitterUrl);
      }

    } catch (err) {
      console.error('Share platform error', err);
    } finally {
      setTimeout(() => setIsGenerating(false), 50);
    }
  };

  const handleCopyTextLink = () => {
    navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
    setCopied(true);
    showToast({
      type: 'success',
      title: t('Link Copied to Clipboard!', '¡Enlace Copiado al Portapapeles!'),
      description: t('Send it to your friends so they can enter and challenge you directly.', 'Envíalo a tus amigos para que entren a competir contigo de inmediato.'),
      duration: 3500
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-[420px] m-auto py-4 sm:py-6 flex flex-col items-center">
        
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-2 p-2 rounded-full bg-neutral-900 text-white hover:bg-neutral-800 transition-colors cursor-pointer z-20 shadow-lg border border-neutral-700"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ================= FOTO SHARE CARD (CLEAN WITHOUT QR, WITH DIRECT APP LINK) ================= */}
        <div 
          ref={cardRef}
          id="photo-share-card"
          className="w-full bg-white rounded-[36px] p-4 sm:p-5 shadow-[0_25px_60px_rgba(0,0,0,0.35)] border-4 border-white ring-1 ring-black/10 flex flex-col items-center select-none"
        >
          {/* El marco interior de la "Fotografía" */}
          <div className="w-full bg-[#FAF9F5] border border-neutral-200/90 rounded-[28px] p-5 sm:p-6 flex flex-col items-center text-center relative overflow-hidden">
            
            {/* Header: POOP.LOL + THRONE CHALLENGE Badge */}
            <div className="w-full flex items-center justify-between pb-3 mb-2 z-10">
              <span className="text-xl sm:text-2xl font-black tracking-tighter text-neutral-950 uppercase">
                POOP.LOL
              </span>
              <div className="bg-[#FACC15] border border-amber-300 px-3 py-1 rounded-full text-[11px] font-black text-neutral-950 uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                <Crown className="w-3.5 h-3.5 text-neutral-950 fill-neutral-950 shrink-0" />
                <span>{t('THRONE CHALLENGE', 'DESAFÍO DEL TRONO')}</span>
              </div>
            </div>

            {/* Avatar con Corona y Destellos Amarillos */}
            <div className="my-2 flex flex-col items-center justify-center relative z-10">
              <div className="relative p-1.5 rounded-full bg-[#FACC15] border-2 border-amber-400 shadow-md flex items-center justify-center">
                {/* Corona Arriba */}
                <div className="absolute -top-4 inset-x-0 mx-auto w-7 h-7 bg-[#FACC15] text-neutral-950 p-1 rounded-full border-2 border-amber-400 shadow-xs flex items-center justify-center z-20">
                  <Crown className="w-4 h-4 fill-neutral-950 text-neutral-950" />
                </div>

                <img
                  src={getUserPhoto(username, currentUser?.avatar)}
                  alt={username}
                  className="w-20 h-20 sm:w-22 sm:h-22 rounded-full object-cover border-4 border-white shadow-inner bg-amber-100"
                  crossOrigin="anonymous"
                />

                {/* Insignia de Bandera del País */}
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full p-1 border border-neutral-200 shadow-xs flex items-center justify-center">
                  <CountryFlag countryCode={currentUser?.countryCode || 'US'} className="w-4.5 rounded-xs" />
                </div>
              </div>

              {/* Nombre de Usuario */}
              <h3 className="text-xl sm:text-2xl font-black text-neutral-950 mt-3 tracking-tight truncate max-w-[280px]">
                {username}
              </h3>
              
              <div className="flex items-center gap-1.5 text-neutral-500 font-bold text-xs mt-0.5">
                <span>{currentUser?.country || 'Costa Rica'}</span>
                <span>•</span>
                <span className="text-amber-600 font-black inline-flex items-center gap-1">
                  {streak > 0 ? (
                    <>
                      <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{streak} {t('day streak', 'días de racha')}</span>
                    </>
                  ) : (
                    <span>{t('Poop Fighter', 'Luchador')}</span>
                  )}
                </span>
              </div>
            </div>

            {/* Gran Bloque de Récord / Puesto Mundial */}
            <div className="w-full my-3 p-4 bg-white border border-neutral-200/80 rounded-2xl shadow-xs flex items-center justify-between z-10">
              <div className="text-left">
                <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider block">
                  {t('TOTAL POOPS', 'TOTAL POPÓS')}
                </span>
                <div className="text-3xl sm:text-4xl font-black text-neutral-950 font-mono tracking-tight">
                  {totalPoops.toLocaleString()}
                </div>
              </div>

              <div className="h-10 w-[1px] bg-neutral-200" />

              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider block">
                  {t('CURRENT STREAK', 'RACHA ACTUAL')}
                </span>
                <div className="text-3xl sm:text-4xl font-black text-amber-500 font-mono tracking-tight flex items-center justify-end gap-1">
                  <span>{streak.toLocaleString()}</span>
                  <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                </div>
              </div>
            </div>

            {/* Mensaje de Desafío para Redes */}
            <div className="w-full my-1 p-3 bg-amber-100/60 border border-amber-300/60 rounded-2xl text-center z-10">
              <div className="flex items-center justify-center gap-1 text-amber-900 font-black text-[11px] uppercase tracking-wider">
                <Swords className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {t('CAN YOU TAKE MY THRONE?', '¿CREES QUE PUEDES QUITARME EL TRONO?')}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-extrabold text-neutral-950 mt-1 leading-snug">
                {t(
                  `I've logged ${totalPoops.toLocaleString()} poops. Join a private room and try to beat me → poop.lol`,
                  `Llevo ${totalPoops.toLocaleString()} popós. Únete a una sala privada e intenta superarme → poop.lol`
                )}
              </p>
            </div>

            {/* Pie de Foto con Enlace Directo a la App (Sin QR) */}
            <div className="w-full mt-3 pt-3 border-t border-neutral-200/90 flex items-center justify-between gap-3 z-10">
              
              {/* Badge Oficial de la App y Link Directo */}
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-10 h-10 bg-neutral-950 text-amber-400 rounded-xl border border-neutral-900 shadow-xs flex items-center justify-center font-black text-lg shrink-0 p-1">
                  <img src="/popohero1_transparent.png?v=2" alt="poop.lol" className="w-7 h-7 object-contain" />
                </div>

                <div className="min-w-0">
                  <span className="text-xs font-black uppercase text-neutral-950 tracking-tight block leading-none">
                    POOP.LOL
                  </span>
                  <span className="text-[10px] text-amber-800 font-extrabold tracking-tight block truncate mt-0.5 font-mono bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300/70">
                    poop.lol/u/{cleanUserSlug || 'rank'}
                  </span>
                </div>
              </div>

              {/* Red Social o Link de la Empresa del Usuario */}
              {currentUser?.sponsorUrl ? (
                <div className="flex items-center gap-1.5 p-1.5 bg-white border border-neutral-200 rounded-xl shrink-0 max-w-[145px]">
                  <div className="shrink-0">
                    {renderBrandLogo(currentUser.sponsorText || '', 18, undefined, currentUser.sponsorUrl)}
                  </div>
                  <div className="min-w-0 text-left">
                    <span className="text-[9px] font-black text-neutral-950 truncate block uppercase leading-tight">
                      {currentUser.sponsorText || 'Patrocinador'}
                    </span>
                    <span className="text-[8px] text-neutral-500 truncate block font-bold">
                      {currentUser.sponsorUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-right">
                  <span className="text-xs font-black text-neutral-950 uppercase block tracking-wider">
                    WWW.POOP.LOL
                  </span>
                  <span className="text-[9px] text-neutral-500 font-bold block">
                    {t('Private Room Leagues', 'Ligas de Salas Privadas')}
                  </span>
                </div>
              )}

            </div>

          </div>

        </div>

        {/* ================= CONTROLES Y ACCIONES DE COMPARTIR ================= */}
        <div className="w-full mt-4 space-y-2">
          
          {/* Botón Principal: Compartir en WhatsApp (Descarga Foto + Abre WhatsApp con Link) */}
          <button
            onClick={() => handleShareToPlatform('whatsapp')}
            disabled={isGenerating}
            id="btn-share-card-whatsapp-photo"
            className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.98] text-white font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer uppercase tracking-wider border-2 border-emerald-400"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <WhatsAppIcon size={18} />
                <span>{t('COMPARTIR FOTO EN WHATSAPP', 'COMPARTIR FOTO EN WHATSAPP')}</span>
              </>
            )}
          </button>

          {/* Redes Sociales: Instagram, Facebook, X (Twitter) */}
          <div className="grid grid-cols-3 gap-2">
            
            {/* Instagram Stories / Post */}
            <button
              onClick={() => handleShareToPlatform('instagram')}
              disabled={isGenerating}
              className="py-2.5 px-2 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] hover:opacity-90 active:scale-[0.98] text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <InstagramIcon size={16} />
              <span>Instagram</span>
            </button>

            {/* Facebook */}
            <button
              onClick={() => handleShareToPlatform('facebook')}
              disabled={isGenerating}
              className="py-2.5 px-2 bg-[#1877F2] hover:bg-[#166fe5] active:scale-[0.98] text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <FacebookIcon size={16} />
              <span>Facebook</span>
            </button>

            {/* X / Twitter */}
            <button
              onClick={() => handleShareToPlatform('twitter')}
              disabled={isGenerating}
              className="py-2.5 px-2 bg-neutral-900 hover:bg-black active:scale-[0.98] text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer border border-neutral-700"
            >
              <XIcon size={15} />
              <span>X (Twitter)</span>
            </button>

          </div>

          {/* Botones de Utilidad: Descargar Foto & Copiar Enlace Directo */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            
            {/* Descargar Foto HD */}
            <button
              onClick={handleDownloadPNG}
              disabled={isGenerating}
              className="py-2.5 px-3 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer border border-neutral-200 dark:border-neutral-700"
            >
              <Download className="w-4 h-4 text-amber-500" />
              <span>{t('Download Photo', 'Descargar Foto')}</span>
            </button>

            {/* Copiar Enlace Directo */}
            <button
              onClick={handleCopyTextLink}
              className="py-2.5 px-3 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer border border-neutral-200 dark:border-neutral-700"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-amber-500" />}
              <span>{copied ? t('Copied!', '¡Copiado!') : t('Copy Link', 'Copiar Link')}</span>
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};
