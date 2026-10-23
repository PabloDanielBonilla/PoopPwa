import React, { useState, useEffect } from 'react';
import { X, Share2, Copy, Check, ArrowRight, Trophy, Zap, Crown, ExternalLink, Swords } from 'lucide-react';
import confetti from 'canvas-confetti';
import { showToast } from '../utils/notificationService';
import { WhatsAppIcon, XIcon, InstagramIcon, FacebookIcon, TikTokIcon } from './SocialIcons';
import { useLanguage } from '../context/LanguageContext';
import { CountryFlag } from './CountryFlag';
import { safeOpenUrl } from '../utils/safeOpen';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
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
  } | null;
  onOpenShareModal?: () => void;
  onOpenStoryCard?: () => void;
  onViewLeaderboard: () => void;
  onAttackNextSpot?: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onClose,
  data,
  onOpenStoryCard,
  onViewLeaderboard,
  onAttackNextSpot,
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && !!navigator.share) {
      setCanNativeShare(true);
    }
  }, []);

  useEffect(() => {
    if (isOpen && data) {
      // Fire vibrant celebration confetti
      const end = Date.now() + 2.5 * 1000;
      const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#fbbf24'];

      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [isOpen, data]);

  if (!isOpen || !data) return null;

  const { previousRank, newRank, poopCount, username, isTopSpot, groupInfo } = data;
  const ranksJumped = groupInfo 
    ? Math.max(1, (groupInfo.previousGroupRank || groupInfo.groupRank + 1) - groupInfo.groupRank)
    : Math.max(1, previousRank - newRank);

  const cleanUserSlug = username.toLowerCase().replace(/[^a-z0-9]/g, '');
  const shareUrl = `https://poop.lol/u/${cleanUserSlug || 'rank'}`;
  const shareText = groupInfo
    ? t(
        `I just logged a drop and moved up to #${groupInfo.groupRank} in the "${groupInfo.groupName}" league on poop.lol! Who's catching up?`,
        `¡Acabo de registrar una ida al baño y subí al puesto #${groupInfo.groupRank} en nuestra sala "${groupInfo.groupName}" en poop.lol! ¿Quién me alcanza?`
      )
    : t(
        `I just logged a drop on poop.lol (${poopCount} total)! Join a room with me and let's see who poops more:`,
        `¡Acabo de registrar una ida al baño en poop.lol (${poopCount} en total)! Únete a una sala conmigo y veamos quién va más al baño:`
      );

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
    setCopied(true);
    showToast({
      type: 'success',
      title: t('Challenge Copied to Clipboard!', '¡Reto Copiado al Portapapeles!'),
      description: t('Paste it in your group chat and challenge your friends.', 'Pégalo en tu grupo de chat y desafía a tus amigos.'),
      duration: 3500
    });
    setTimeout(() => setCopied(false), 2000);
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
          handleCopySnippet();
        }
      }
    } else {
      handleCopySnippet();
    }
  };

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
    safeOpenUrl(url);
  };

  const handleShareX = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    safeOpenUrl(url);
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    safeOpenUrl(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="bg-white dark:bg-[#18181b] rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border-2 border-amber-300 dark:border-amber-500/60 relative text-center overflow-hidden animate-in zoom-in-95 duration-300 text-neutral-950 dark:text-white my-auto max-h-[94vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background glow orb */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-amber-200/50 dark:bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-amber-300/40 dark:bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Mascot Avatar + Crown */}
        <div className="relative inline-block mx-auto mb-2 mt-1">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 flex items-center justify-center shadow-inner relative overflow-hidden group">
            <img src="/popohero1_transparent.png?v=2" alt="poop.lol" className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-md" />
            {isTopSpot && (
              <div className="absolute inset-0 bg-amber-400/20 mix-blend-overlay" />
            )}
          </div>
          
          {/* Badge Icon */}
          <div className="absolute -top-2.5 -right-2.5 bg-amber-400 border-2 border-white dark:border-neutral-900 text-neutral-950 rounded-full p-1.5 shadow-md">
            {isTopSpot ? <Crown className="w-4 h-4 fill-neutral-950" /> : <Trophy className="w-4 h-4" />}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-black text-neutral-950 dark:text-white tracking-tight uppercase">
          {groupInfo ? (
            groupInfo.isGroupKing 
              ? t("YOU ARE THE #1 IN YOUR LEAGUE!", "¡ERES EL #1 EN TU LIGA!")
              : t(`YOU'RE #${groupInfo.groupRank} IN YOUR LEAGUE!`, `¡ESTÁS EN EL #${groupInfo.groupRank} EN TU LIGA!`)
          ) : (
            t("DROP LOGGED!", "¡POPÓ REGISTRADA!")
          )}
        </h2>
        
        <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 mt-0.5 mb-3">
          {groupInfo ? (
            groupInfo.isGroupKing
              ? t(`You claimed the throne in ${groupInfo.groupName}! Defend it!`, `¡Reclamaste el trono en ${groupInfo.groupName}! ¡Defiéndelo!`)
              : t(`¡Punto sumado en "${groupInfo.groupName}"!`, `¡Punto sumado en "${groupInfo.groupName}"!`)
          ) : (
            t("You scored another drop! Check your room ranking below.", "¡Sumaste otra victoria! Revisa el ranking de tus salas abajo.")
          )}
        </p>

        {/* Rank Leap Card Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 rounded-2xl p-3.5 mb-3.5 shadow-xs">
          <div className="text-[10px] font-black text-amber-900 dark:text-amber-400 uppercase tracking-wider mb-1">
            {groupInfo ? t('LEAGUE RANK PROMOTION', 'ASCENSO EN LA CLASIFICACIÓN DE TU LIGA') : t('SCORE CONFIRMED', 'REGISTRO CONFIRMADO')}
          </div>

          {groupInfo ? (
            <>
              <div className="flex items-center justify-center gap-3">
                <div className="text-sm font-bold text-neutral-400 dark:text-neutral-500 line-through">
                  #{groupInfo.previousGroupRank || groupInfo.groupRank + 1}
                </div>
                <ArrowRight className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                <div className="text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-300">
                  #{groupInfo.groupRank}
                </div>
              </div>

              <div className="mt-1.5 text-xs font-black text-amber-950 dark:text-neutral-950 bg-amber-200 dark:bg-amber-400 rounded-full py-0.5 px-3 inline-flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-900 dark:text-amber-950 shrink-0" />
                <span>+{ranksJumped} {ranksJumped === 1 ? t('spot overtaken in league', 'puesto superado en tu liga') : t('poopers overtaken in league', 'rivales superados en tu liga')}</span>
              </div>
            </>
          ) : (
            <div className="text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-300 flex items-center justify-center gap-2">
              <span>+1</span>
              <span className="text-base text-amber-700 dark:text-amber-400 font-bold">{t('point added', 'punto añadido')}</span>
            </div>
          )}

          {/* Poop count in this room */}
          <div className="mt-2 text-xs font-bold text-neutral-600 dark:text-neutral-300">
            {groupInfo ? (
              <span>
                {t('League Score', 'Puntaje en tu Liga')}: <strong className="text-amber-600 dark:text-amber-400 font-black">{groupInfo.groupPoops.toLocaleString()} {t('poops', 'popós')}</strong>
              </span>
            ) : (
              <span>
                {t('Total Drops', 'Total Registrado')}: <strong className="text-amber-600 dark:text-amber-400 font-black">{poopCount.toLocaleString()} {t('poops', 'popós')}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          
          {/* Primary CTA: Boost / Attack Next Spot */}
          {onAttackNextSpot && (
            <button
              onClick={() => {
                onClose();
                onAttackNextSpot();
              }}
              className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-neutral-950 font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer uppercase tracking-wider border-2 border-amber-400"
            >
              <Zap className="w-4 h-4 text-neutral-950 fill-neutral-950" />
              <span>{isTopSpot ? t('DEFEND THRONE (+1 POOP)', 'DEFENDER TRONO (+1 POPÓ)') : t('OVERTAKE NEXT SPOT NOW', 'ADELANTAR SIGUIENTE PUESTO')}</span>
            </button>
          )}

          {/* Story Card CTA Button for Instagram & TikTok */}
          {onOpenStoryCard && (
            <button
              onClick={() => {
                onClose();
                onOpenStoryCard();
              }}
              id="btn-celebration-story-card"
              className="w-full py-2.5 px-3 bg-gradient-to-r from-neutral-950 via-neutral-900 to-amber-950 hover:to-amber-900 text-amber-300 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98] cursor-pointer border border-amber-400/50 uppercase tracking-wider group"
            >
              <div className="flex items-center gap-1 shrink-0">
                <InstagramIcon colored size={18} className="rounded-full" />
                <TikTokIcon colored size={18} className="rounded-full" />
              </div>
              <span className="truncate">{t('GENERATE STORY CARD (INSTA/TIKTOK)', 'GENERAR TARJETA PARA HISTORIAS')}</span>
            </button>
          )}

          {/* Direct 1-Click Social Share Row */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            <button
              onClick={handleShareWhatsApp}
              title="Share on WhatsApp"
              className="py-2 px-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group active:scale-95 min-w-0"
            >
              <WhatsAppIcon colored className="w-4 h-4" />
              <span className="text-[9px] font-bold truncate">WhatsApp</span>
            </button>

            <button
              onClick={handleShareX}
              title="Share on X"
              className="py-2 px-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-neutral-950 dark:text-white font-bold text-xs rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group active:scale-95 min-w-0"
            >
              <XIcon colored className="w-4 h-4" />
              <span className="text-[9px] font-bold truncate">X</span>
            </button>

            <button
              onClick={handleShareFacebook}
              title="Share on Facebook"
              className="py-2 px-1 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300 font-bold text-xs rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group active:scale-95 min-w-0"
            >
              <FacebookIcon colored className="w-4 h-4" />
              <span className="text-[9px] font-bold truncate">Facebook</span>
            </button>

            <button
              onClick={handleCopySnippet}
              title="Copy link"
              className="py-2 px-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold text-xs rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group active:scale-95 min-w-0"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span className="text-[9px] font-bold truncate">{copied ? t('Copied!', '¡Listo!') : t('Copy', 'Copiar')}</span>
            </button>
          </div>

          {/* Leaderboard Link */}
          <button
            onClick={onViewLeaderboard}
            className="w-full text-xs font-bold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors py-1 cursor-pointer pt-2"
          >
            {groupInfo ? t('View League Classification', 'Ver Clasificación de tu Liga') : t('View Room Leaderboard', 'Ver Clasificación de la Sala')}
          </button>
        </div>
      </div>
    </div>
  );
};
