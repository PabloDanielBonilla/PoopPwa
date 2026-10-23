import React, { useState, useEffect } from 'react';
import { X, Check, Copy, Share2, Globe, Flame, Swords, Trophy, Sparkles } from 'lucide-react';
import { User } from '../types';
import { WhatsAppIcon, XIcon, InstagramIcon, FacebookIcon } from './SocialIcons';
import { showToast } from '../utils/notificationService';
import { useLanguage } from '../context/LanguageContext';
import { getUserPhoto } from '../utils/avatarUtils';
import { renderBrandLogo } from './BrandLogos';
import { CountryFlag } from './CountryFlag';
import { safeOpenUrl } from '../utils/safeOpen';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onOpenWrapped?: (platform?: 'whatsapp') => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenWrapped,
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && !!navigator.share) {
      setCanNativeShare(true);
    }
  }, []);

  if (!isOpen) return null;

  const poops = currentUser?.totalPoops ?? 0;
  const username = currentUser?.username || 'You';

  const shareText = t(
    `I've logged ${poops.toLocaleString()} poops on poop.lol. Create a private room with me and let's see who poops more:`,
    `¡Llevo ${poops.toLocaleString()} popós registrados en poop.lol! Crea una sala privada conmigo y veamos quién va más al baño:`
  );
  const shareUrl = `https://poop.lol`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
    setCopied(true);
    showToast({
      type: 'success',
      title: t('Challenge Copied to Clipboard!', '¡Reto Copiado al Portapapeles!'),
      description: t('Ready to challenge your friends in any chat.', 'Listo para desafiar a tus amigos en cualquier chat.'),
      duration: 3500
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'poop.lol - Room Challenge',
          text: `${shareText}\n\n${shareUrl}`,
        });
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleShareWhatsApp = () => {
    if (onOpenWrapped) {
      onClose();
      onOpenWrapped('whatsapp');
    } else {
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
      safeOpenUrl(url);
    }
  };

  const handleShareX = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    safeOpenUrl(url);
  };

  const handleShareInstagram = () => {
    handleCopy();
    safeOpenUrl('https://instagram.com');
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    safeOpenUrl(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container with Safe Height & Scrolling */}
      <div className="relative bg-white dark:bg-[#18181b] text-neutral-950 dark:text-white rounded-3xl max-w-sm w-full p-4 sm:p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 z-10 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto overscroll-contain my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95 z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center pb-2 sm:pb-3 pr-6 sm:pr-0">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 mx-auto flex items-center justify-center mb-1.5 shadow-2xs">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-neutral-950 dark:text-white">
            {t('Challenge Your Friends', 'Desafía a tus Amigos')}
          </h3>
          <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400">
            {t('Invita a tus amigos a tu sala privada y reta a quien más aguante.', 'Proclama tu supremacía y rétalos a destronarte.')}
          </p>
        </div>

        {/* Custom Share Preview Card Graphic */}
        <div className="my-2.5 sm:my-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-amber-50 to-neutral-50 dark:from-amber-950/30 dark:to-neutral-900 border-2 border-amber-300 dark:border-amber-700/60 text-center shadow-xs">
          
          {/* User Photo & Character Avatar with Badge */}
          <div className="flex flex-col items-center justify-center mb-2">
            <div className="relative p-1 rounded-full bg-gradient-to-b from-amber-400 via-amber-300 to-amber-500 border-2 border-white shadow-md flex items-center justify-center">
              <img
                src={getUserPhoto(username, currentUser?.avatar)}
                alt={username}
                className="w-14 h-14 rounded-full object-cover border-2 border-white bg-amber-100 shadow-inner shrink-0"
              />
              <span className="absolute -bottom-1 -right-1 p-1 bg-amber-400 border border-white rounded-full text-neutral-950 shadow-md">
                <Trophy className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="mt-1.5 flex items-center gap-1.5 px-2.5 py-0.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full shadow-2xs">
              {currentUser?.countryCode && (
                <CountryFlag countryCode={currentUser.countryCode} className="w-3.5 shrink-0" />
              )}
              <span className="font-extrabold text-xs text-neutral-950 dark:text-white truncate max-w-[160px]">
                {username}
              </span>
            </div>
          </div>

          <div className="my-2">
            <div className="text-4xl sm:text-5xl font-black text-neutral-950 dark:text-white tracking-tighter leading-none truncate">
              {poops.toLocaleString()}
            </div>
            <div className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-widest mt-1 flex items-center justify-center gap-1">
              <span>{t('Poops Registered', 'Popós Registrados')}</span>
              <Flame className="w-3 h-3 text-neutral-500 dark:text-neutral-400" />
            </div>
          </div>

          {/* App Link Pill with Avatar */}
          <div className="my-2.5 p-2.5 bg-white dark:bg-neutral-900 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-2 text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-neutral-950 text-amber-400 flex items-center justify-center font-black text-base shadow-xs shrink-0 p-1">
                <img src="/popohero1_transparent.png?v=2" alt="poop.lol" className="w-6 h-6 object-contain" />
              </div>

              <div>
                <span className="text-[10px] font-black uppercase text-neutral-900 dark:text-white block leading-tight">
                  POOP.LOL
                </span>
                <span className="text-[9px] text-amber-700 dark:text-amber-400 font-extrabold block truncate font-mono">
                  poop.lol/u/{username}
                </span>
              </div>
            </div>

            {/* Custom Company / Social Link */}
            {currentUser?.sponsorUrl && (
              <div className="flex items-center gap-1 p-1 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 rounded-lg shrink-0 max-w-[120px]">
                {renderBrandLogo(currentUser.platform || 'company', 16, currentUser.avatar, currentUser.sponsorUrl)}
                <span className="text-[8px] font-black text-amber-950 dark:text-amber-300 truncate">
                  {currentUser.sponsorText || username}
                </span>
              </div>
            )}
          </div>

          {/* Taunt Snippet */}
          <div className="p-2 bg-white/95 dark:bg-neutral-900/90 rounded-xl border border-amber-300 dark:border-amber-700/60 text-left shadow-2xs">
            <p className="text-[10px] sm:text-[11px] text-neutral-800 dark:text-neutral-200 font-bold italic line-clamp-2 leading-snug">
              "{shareText}"
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {/* Poop Wrapped CTA Button */}
          {onOpenWrapped && (
            <button
              onClick={() => {
                onClose();
                onOpenWrapped();
              }}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-neutral-950 to-amber-950 hover:to-amber-900 border border-amber-500/50 text-amber-300 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <Swords className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{t('Create Official Challenge Card', 'Crear Tarjeta Oficial de Reto')}</span>
            </button>
          )}

          {/* Native Share Sheet Button (if supported) */}
          {canNativeShare && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <Share2 className="w-3.5 h-3.5 shrink-0 text-neutral-950" />
              <span>{t('Share with friends (WhatsApp / Stories)', 'Compartir con amigos (WhatsApp / Stories)')}</span>
            </button>
          )}

          {/* Copy Link Button */}
          <button
            onClick={handleCopy}
            className="w-full py-2.5 px-3 bg-neutral-950 dark:bg-neutral-800 hover:bg-neutral-800 dark:hover:bg-neutral-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
            <span className="truncate">{copied ? t('Copied to Clipboard!', '¡Copiado al Portapapeles!') : t('Copy Text & Link', 'Copiar Texto y Enlace')}</span>
          </button>

          {/* Social Share Buttons with Original Logos */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-1">
            {/* WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              title="Share on WhatsApp"
              className="py-2 sm:py-2.5 px-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:border-emerald-200 dark:hover:border-emerald-700 border border-emerald-100 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group active:scale-95 min-w-0 overflow-hidden"
            >
              <WhatsAppIcon colored className="w-5 h-5 transition-transform group-hover:scale-110 shrink-0" />
              <span className="text-[9px] sm:text-[10px] font-bold truncate max-w-full">WhatsApp</span>
            </button>

            {/* X (Twitter) */}
            <button
              onClick={handleShareX}
              title="Share on X"
              className="py-2 sm:py-2.5 px-1 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 border border-neutral-200 dark:border-neutral-800 text-neutral-950 dark:text-white font-bold text-xs rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group active:scale-95 min-w-0 overflow-hidden"
            >
              <XIcon colored className="w-5 h-5 transition-transform group-hover:scale-110 shrink-0" />
              <span className="text-[9px] sm:text-[10px] font-bold truncate max-w-full">X</span>
            </button>

            {/* Instagram */}
            <button
              onClick={handleShareInstagram}
              title="Share on Instagram"
              className="py-2 sm:py-2.5 px-1 bg-pink-50 dark:bg-pink-950/40 hover:bg-pink-100 dark:hover:bg-pink-900/50 hover:border-pink-200 dark:hover:border-pink-700 border border-pink-100 dark:border-pink-800 text-pink-800 dark:text-pink-300 font-bold text-xs rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group active:scale-95 min-w-0 overflow-hidden"
            >
              <InstagramIcon colored className="w-5 h-5 transition-transform group-hover:scale-110 rounded-md shrink-0" />
              <span className="text-[9px] sm:text-[10px] font-bold truncate max-w-full">Stories</span>
            </button>

            {/* Facebook */}
            <button
              onClick={handleShareFacebook}
              title="Share on Facebook"
              className="py-2 sm:py-2.5 px-1 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-200 dark:hover:border-blue-700 border border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-300 font-bold text-xs rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group active:scale-95 min-w-0 overflow-hidden"
            >
              <FacebookIcon colored className="w-5 h-5 transition-transform group-hover:scale-110 shrink-0" />
              <span className="text-[9px] sm:text-[10px] font-bold truncate max-w-full">Facebook</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
