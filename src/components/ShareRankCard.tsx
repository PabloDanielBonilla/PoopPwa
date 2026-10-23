import React, { useState, useEffect } from 'react';
import { Copy, Check, Share2, Sparkles, Swords, Dices, Flame, Crown, Coffee, Skull, Zap } from 'lucide-react';
import { User } from '../types';
import { WhatsAppIcon, XIcon, InstagramIcon, TikTokIcon, FacebookIcon } from './SocialIcons';
import { showToast } from '../utils/notificationService';
import { useLanguage } from '../context/LanguageContext';
import { safeOpenUrl } from '../utils/safeOpen';

export const getFunnyTaunts = (lang: 'en' | 'es') => [
  {
    id: 'fiber',
    icon: Flame,
    badge: lang === 'es' ? 'Poder de Fibra' : 'Pure Fiber Power',
    tagline: lang === 'es' ? '¿Tienes agallas o tienes miedo?' : 'Got the gut or got fear?',
    title: lang === 'es' ? 'Desafío de Fibra' : 'Fiber Challenge',
    template: (rank: number, count: number, country: string) =>
      lang === 'es'
        ? `Menos excusas y más avena. Tengo ${count} popós y soy el #${rank} en ${country} en poop.lol. ¿Tienes lo necesario para alcanzarme?`
        : `Less excuses, more oats. I have ${count} poops and I'm #${rank} in ${country} on poop.lol. Got the gut to catch up or need prunes?`,
  },
  {
    id: 'royalty',
    icon: Crown,
    badge: lang === 'es' ? 'Rey del Trono' : 'King of the Throne',
    tagline: lang === 'es' ? 'Inclínate ante la majestad' : 'Kneel before your majesty',
    title: lang === 'es' ? 'Soberano del Baño' : 'Bathroom Sovereign',
    template: (rank: number, count: number, country: string) =>
      lang === 'es'
        ? `Cagar es un arte y yo soy Miguel Ángel. Con ${count} victorias registradas, estoy en el puesto #${rank} en mi sala en poop.lol. ¡Intenta destronarme o vive en mi sombra!`
        : `Pooping is an art and I am Michelangelo. With ${count} recorded victories, I am ranked #${rank} in my room on poop.lol. Try to dethrone me or live in my shadow!`,
  },
  {
    id: 'turbo',
    icon: Zap,
    badge: lang === 'es' ? 'Metabolismo Turbo' : 'Turbo Metabolism',
    tagline: lang === 'es' ? 'Velocidad de la luz' : 'Speed of light',
    title: lang === 'es' ? 'Digestión Supersónica' : 'Supersonic Digestion',
    template: (rank: number, count: number, country: string) =>
      lang === 'es'
        ? `Mi digestión va a la velocidad de la luz (${count} registros). Estoy en el puesto #${rank} en mi sala de poop.lol. ¿Qué tan rápido es tu metabolismo? ¡Te desafío!`
        : `My digestion moves at lightspeed (${count} logged drops). I'm ranked #${rank} in our room on poop.lol. How fast is your metabolism? I challenge you!`,
  },
  {
    id: 'coffee',
    icon: Coffee,
    badge: lang === 'es' ? 'Impulso de Café' : 'Coffee Boost',
    tagline: lang === 'es' ? 'Un expreso a la gloria' : 'One espresso to glory',
    title: lang === 'es' ? 'Poder del Expreso' : 'Espresso Power',
    template: (rank: number, count: number, country: string) =>
      lang === 'es'
        ? `Dos tazas de café después y estoy en el puesto #${rank} de la sala en poop.lol con ${count} registros. Te espero en el trono si puedes llegar.`
        : `Two cups of coffee later and I'm ranked #${rank} in our room on poop.lol with ${count} poops. Waiting on the throne if you can make it.`,
  },
  {
    id: 'roast',
    icon: Skull,
    badge: lang === 'es' ? 'Ataque Directo' : 'Direct Roast',
    tagline: lang === 'es' ? 'Duelo en el inodoro' : 'Toilet Deathmatch',
    title: lang === 'es' ? 'Alerta de Estreñimiento' : 'Constipation Alert',
    template: (rank: number, count: number, country: string) =>
      lang === 'es'
        ? `Que alguien le avise a mis amigos que su digestión va a paso de tortuga. Estoy en el puesto #${rank} en poop.lol (${count} registros). ¿Me vas a dejar ganar tan fácil?`
        : `Someone tell my friends their digestion is at turtle speed. I'm ranked #${rank} on poop.lol (${count} poops). Are you gonna let me win this easily or what?`,
  },
];

interface ShareRankCardProps {
  currentUser: User | null;
  activeGroup?: any;
  onOpenWrapped?: (autoSharePlatform?: 'whatsapp') => void;
}

export const ShareRankCard: React.FC<ShareRankCardProps> = ({ currentUser, activeGroup, onOpenWrapped }) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && !!navigator.share) {
      setCanNativeShare(true);
    }
  }, []);

  const username = currentUser?.username?.toLowerCase().replace(/\s+/g, '') || 'pooper';
  const userPoops = currentUser?.totalPoops ?? 0;

  // If in an active private room, challenge is directed to the room
  const userInGroup = activeGroup?.members?.find((m: any) => m.userId === currentUser?.id);
  const groupRank = userInGroup?.rank || 1;
  const groupPoops = userInGroup?.groupPoops || userPoops;
  const roomInviteUrl = activeGroup ? `https://poop.lol/?join=${activeGroup.code}` : (currentUser ? `https://poop.lol/u/${username}` : 'https://poop.lol');

  const shareUrl = roomInviteUrl;

  const shareText = activeGroup
    ? t(
        `I'm ranked #${groupRank} in our "${activeGroup.name}" private room on poop.lol with ${groupPoops} poops! Join our league with code ${activeGroup.code} and try to beat me:`,
        `¡Ocupo el puesto #${groupRank} en nuestra sala privada "${activeGroup.name}" en poop.lol con ${groupPoops} popós! Únete con el código ${activeGroup.code} y trata de ganarme:`
      )
    : (currentUser ? t(
        `I have logged ${userPoops} poops on poop.lol! Create a private room with me and see who poops more:`,
        `¡Llevo ${userPoops} popós registradas en poop.lol! Crea una sala privada conmigo y veamos quién va más al baño:`
      ) : t(
        "Create private rooms with your friends or coworkers on poop.lol to see who poops the most!",
        "¡Crea salas privadas con tus amigos o compañeros en poop.lol para ver quién va más al baño!"
      ));

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      setCopied(true);
      showToast({
        type: 'success',
        title: t('Challenge Copied to Clipboard!', '¡Desafío Copiado al Portapapeles!'),
        description: t('Ready to paste in your WhatsApp group and challenge your rivals.', 'Listo para pegar en tu grupo de WhatsApp y retar a tus rivales.'),
        duration: 3500
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'poop.lol - Throne Challenge',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User dismissed or failed, fallback to copy
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleShareWhatsApp = () => {
    const avatarFullUrl = currentUser?.avatar 
      ? (currentUser.avatar.startsWith('http') ? currentUser.avatar : `${window.location.origin}${currentUser.avatar}`)
      : '';
    const textToShare = avatarFullUrl 
      ? `${shareText}\n\n${t('My Avatar:', 'Mi Foto:')} ${avatarFullUrl}\n\n${shareUrl}`
      : `${shareText}\n\n${shareUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(textToShare)}`;
    safeOpenUrl(url);
  };

  const handleShareTwitter = () => {
    const avatarFullUrl = currentUser?.avatar 
      ? (currentUser.avatar.startsWith('http') ? currentUser.avatar : `${window.location.origin}${currentUser.avatar}`)
      : '';
    const textToShare = avatarFullUrl 
      ? `${shareText}\n\n${t('My Avatar:', 'Mi Foto:')} ${avatarFullUrl}`
      : shareText;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(textToShare)}&url=${encodeURIComponent(shareUrl)}`;
    safeOpenUrl(url);
  };

  const handleShareInstagram = () => {
    const avatarFullUrl = currentUser?.avatar 
      ? (currentUser.avatar.startsWith('http') ? currentUser.avatar : `${window.location.origin}${currentUser.avatar}`)
      : '';
    const textToCopy = avatarFullUrl 
      ? `${shareText}\n\n${t('My Foto:', 'Mi Foto:')} ${avatarFullUrl}\n\n${shareUrl}`
      : `${shareText}\n\n${shareUrl}`;
    navigator.clipboard.writeText(textToCopy).catch(() => {});
    showToast({
      type: 'success',
      title: t('Opening Instagram!', '¡Abriendo Instagram!'),
      description: t('Your challenge text and photo link were copied to clipboard.', 'Tu texto de desafío y enlace de foto se han copiado al portapapeles.'),
      duration: 3500
    });
    safeOpenUrl('https://instagram.com');
  };

  const handleShareFacebook = () => {
    const avatarFullUrl = currentUser?.avatar 
      ? (currentUser.avatar.startsWith('http') ? currentUser.avatar : `${window.location.origin}${currentUser.avatar}`)
      : '';
    // Share the actual avatar image URL directly to Facebook so Facebook displays the image itself as the preview!
    const targetUrl = avatarFullUrl || shareUrl;
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(targetUrl)}&quote=${encodeURIComponent(shareText)}`;
    safeOpenUrl(url);
  };

  return (
    <div className="w-full bg-white dark:bg-[#18181b] rounded-3xl border border-neutral-200/90 dark:border-neutral-800 p-3.5 sm:p-5 md:p-6 shadow-xs select-none transition-colors">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-xs sm:text-sm font-black tracking-wider text-neutral-950 dark:text-white uppercase flex items-center gap-1.5">
            <span>{t('GAME OF THRONES & CHALLENGES', 'GUERRA DE TRONOS Y DESAFÍOS')}</span>
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          </h3>
          <p className="text-[11px] sm:text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
            {t('Show your friends who rules the throne with fiber and attitude.', 'Demuestra a tus amigos quién manda en el trono con fibra y actitud.')}
          </p>
        </div>

        {/* Native Mobile Share Button */}
        {canNativeShare && (
          <button
            onClick={handleNativeShare}
            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 hover:bg-amber-200 dark:hover:bg-amber-900 text-amber-950 dark:text-amber-300 font-bold text-xs transition-colors cursor-pointer active:scale-95 shadow-2xs border border-transparent dark:border-amber-800/40"
            title={t('Share via device', 'Compartir vía dispositivo')}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('Share', 'Compartir')}</span>
          </button>
        )}
      </div>

      {/* Viral Challenge Promo Banner - Clean & Ultra Responsive */}
      {onOpenWrapped && (
        <button
          onClick={() => onOpenWrapped()}
          className="w-full mb-3 p-3.5 sm:p-4 bg-gradient-to-r from-amber-100/90 via-amber-200/60 to-orange-100/80 dark:from-amber-950/40 dark:via-amber-900/30 dark:to-orange-950/40 hover:from-amber-200/90 hover:to-orange-200/90 dark:hover:from-amber-950/60 dark:hover:to-orange-950/60 border-2 border-amber-400 dark:border-amber-500/60 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-left group transition-all shadow-sm cursor-pointer active:scale-[0.99] relative overflow-hidden"
        >
          {/* Subtle Top Pill */}
          <div className="absolute top-2 right-3 hidden sm:flex items-center gap-1 text-[9px] font-black uppercase text-amber-900 dark:text-amber-300 bg-amber-300/80 dark:bg-amber-950/80 px-2 py-0.5 rounded-full border border-transparent dark:border-amber-700/50">
            <Swords className="w-3 h-3 text-amber-950 dark:text-amber-300" />
          </div>

          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
            {/* Texto Descriptivo */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-neutral-950 dark:text-white group-hover:text-amber-900 dark:group-hover:text-amber-300 transition-colors leading-tight flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5 text-neutral-950 dark:text-amber-400 shrink-0" />
                  <span>{t('Challenge your friends to beat you', 'Reta a tus amigos a superarte')}</span>
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-neutral-700 dark:text-neutral-300 font-medium mt-0.5 leading-snug">
                {t('Create your custom challenge card for your chats.', 'Crea tu tarjeta personalizada de desafíos para tus chats.')}
              </p>
            </div>
          </div>

          {/* Botón CTA Responsive */}
          <div className="flex items-center justify-end sm:justify-center shrink-0 pt-1 sm:pt-0">
            <span className="w-full sm:w-auto text-center text-xs sm:text-sm font-black text-neutral-950 bg-amber-300 group-hover:bg-amber-400 dark:bg-amber-400 dark:group-hover:bg-amber-300 px-3 py-1.5 rounded-xl group-hover:translate-x-0.5 transition-all shadow-xs uppercase tracking-tight flex items-center justify-center gap-1.5 border border-amber-400/80">
              <Flame className="w-3.5 h-3.5 fill-neutral-950" />
              <span>{t('Challenge Group', 'Retar Grupo')}</span>
              <span className="text-sm sm:text-base leading-none">→</span>
            </span>
          </div>
        </button>
      )}

      {/* 4 Social Action Buttons - Flexible Grid with Truncate Safe Text */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 my-2.5">
        
        {/* WhatsApp */}
        <button
          onClick={onOpenWrapped ? () => onOpenWrapped('whatsapp') : handleShareWhatsApp}
          title="Share on WhatsApp"
          className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-neutral-100 dark:border-neutral-800 hover:border-emerald-200 dark:hover:border-emerald-700/60 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all cursor-pointer group active:scale-95 min-w-0 overflow-hidden"
        >
          <WhatsAppIcon colored className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 group-hover:scale-110 transition-transform" />
          <span className="text-[9px] sm:text-[10px] font-bold text-neutral-600 dark:text-neutral-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 mt-1 truncate max-w-full text-center px-0.5 leading-tight">WhatsApp</span>
        </button>
 
        {/* X (Twitter) */}
        <button
          onClick={handleShareTwitter}
          title="Share on X"
          className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-neutral-100 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all cursor-pointer group active:scale-95 min-w-0 overflow-hidden"
        >
          <XIcon colored className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 group-hover:scale-110 transition-transform" />
          <span className="text-[9px] sm:text-[10px] font-bold text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-950 dark:group-hover:text-white mt-1 truncate max-w-full text-center px-0.5 leading-tight">X</span>
        </button>
 
        {/* Instagram */}
        <button
          onClick={handleShareInstagram}
          title="Share to Instagram Stories"
          className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-neutral-100 dark:border-neutral-800 hover:border-pink-200 dark:hover:border-pink-700/60 hover:bg-pink-50/50 dark:hover:bg-pink-950/30 transition-all cursor-pointer group active:scale-95 min-w-0 overflow-hidden"
        >
          <InstagramIcon colored className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 group-hover:scale-110 transition-transform" />
          <span className="text-[9px] sm:text-[10px] font-bold text-neutral-600 dark:text-neutral-400 group-hover:text-pink-700 dark:group-hover:text-pink-400 mt-1 truncate max-w-full text-center px-0.5 leading-tight">Stories</span>
        </button>
 
        {/* Facebook */}
        <button
          onClick={handleShareFacebook}
          title="Share on Facebook"
          className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-neutral-100 dark:border-neutral-800 hover:border-blue-200 dark:hover:border-blue-700/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all cursor-pointer group active:scale-95 min-w-0 overflow-hidden"
        >
          <FacebookIcon colored className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 group-hover:scale-110 transition-transform" />
          <span className="text-[9px] sm:text-[10px] font-bold text-neutral-600 dark:text-neutral-400 group-hover:text-blue-700 dark:group-hover:text-blue-400 mt-1 truncate max-w-full text-center px-0.5 leading-tight">Facebook</span>
        </button>

      </div>

      {/* Copy Link Input Bar */}
      <div className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 rounded-xl p-1.5 pl-2.5 sm:pl-3 transition-colors">
        <span className="text-[11px] sm:text-xs font-medium text-neutral-500 dark:text-neutral-400 truncate min-w-0 flex-1 select-all font-mono">
          {shareUrl}
        </span>
        <button
          onClick={handleCopy}
          id="btn-copy-share-link"
          className="bg-neutral-900 hover:bg-neutral-800 dark:bg-[#facc15] dark:hover:bg-[#eab308] text-white dark:text-neutral-950 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 active:scale-95 shadow-2xs"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? t('Copied!', '¡Copiado!') : t('Copy', 'Copiar')}</span>
        </button>
      </div>

    </div>
  );
};

