import React, { useState, useRef, useEffect } from 'react';
import { 
  ExternalLink, 
  Crown, 
  Sparkles, 
  Eye, 
  Megaphone, 
  Globe, 
  Tv, 
  Music, 
  Code, 
  Camera, 
  MessageSquare,
  ShieldCheck,
  Zap,
  TrendingUp
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { RealtimeBrandLogo } from './BrandLogos';
import { trackSponsorClick } from '../lib/api';

export interface SponsorBadgeProps {
  userId?: string;
  username: string;
  rank?: number;
  sponsorUrl?: string;
  sponsorText?: string;
  sponsorClicks?: number;
  isCurrentUser?: boolean;
  isKing?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showEmptyState?: boolean;
  onOpenSponsorModal?: () => void;
  className?: string;
}

export type PlatformType = 'youtube' | 'twitch' | 'twitter' | 'instagram' | 'github' | 'spotify' | 'tiktok' | 'website';

export function detectPlatform(url: string = '', text: string = ''): PlatformType {
  const lowUrl = url.toLowerCase();
  const lowText = text.toLowerCase();
  
  if (lowUrl.includes('youtube.com') || lowUrl.includes('youtu.be') || lowText.includes('youtube') || lowText.includes('canal')) {
    return 'youtube';
  }
  if (lowUrl.includes('twitch.tv') || lowText.includes('twitch') || lowText.includes('stream')) {
    return 'twitch';
  }
  if (lowUrl.includes('twitter.com') || lowUrl.includes('x.com') || lowText.includes('twitter') || lowText.startsWith('@')) {
    return 'twitter';
  }
  if (lowUrl.includes('instagram.com') || lowText.includes('instagram') || lowText.includes('taquería') || lowText.includes('ig')) {
    return 'instagram';
  }
  if (lowUrl.includes('github.com') || lowText.includes('github') || lowText.includes('tech') || lowText.includes('dev')) {
    return 'github';
  }
  if (lowUrl.includes('spotify.com') || lowText.includes('spotify') || lowText.includes('podcast')) {
    return 'spotify';
  }
  if (lowUrl.includes('tiktok.com') || lowText.includes('tiktok')) {
    return 'tiktok';
  }
  return 'website';
}

export const PLATFORM_CONFIG: Record<PlatformType, {
  name: string;
  icon: any;
  chipClass: string;
  badgeClass: string;
  glowClass: string;
  hoverClass: string;
}> = {
  youtube: {
    name: 'YouTube',
    icon: Tv,
    chipClass: 'bg-white/80 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 shadow-2xs',
    badgeClass: 'bg-transparent text-red-600',
    glowClass: 'shadow-red-500/10',
    hoverClass: 'hover:border-red-500 dark:hover:border-red-400',
  },
  twitch: {
    name: 'Twitch',
    icon: Zap,
    chipClass: 'bg-white/80 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 shadow-2xs',
    badgeClass: 'bg-transparent text-purple-600',
    glowClass: 'shadow-purple-500/10',
    hoverClass: 'hover:border-purple-500 dark:hover:border-purple-400',
  },
  twitter: {
    name: 'X / Twitter',
    icon: MessageSquare,
    chipClass: 'bg-white/80 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 shadow-2xs',
    badgeClass: 'bg-transparent text-sky-500',
    glowClass: 'shadow-sky-500/10',
    hoverClass: 'hover:border-sky-500 dark:hover:border-sky-400',
  },
  instagram: {
    name: 'Instagram',
    icon: Camera,
    chipClass: 'bg-white/80 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 shadow-2xs',
    badgeClass: 'bg-transparent text-pink-600',
    glowClass: 'shadow-pink-500/10',
    hoverClass: 'hover:border-pink-500 dark:hover:border-pink-400',
  },
  github: {
    name: 'GitHub',
    icon: Code,
    chipClass: 'bg-white/80 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 shadow-2xs',
    badgeClass: 'bg-transparent text-slate-800 dark:text-slate-200',
    glowClass: 'shadow-slate-500/10',
    hoverClass: 'hover:border-slate-500 dark:hover:border-slate-400',
  },
  spotify: {
    name: 'Spotify',
    icon: Music,
    chipClass: 'bg-white/80 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 shadow-2xs',
    badgeClass: 'bg-transparent text-emerald-600',
    glowClass: 'shadow-emerald-500/10',
    hoverClass: 'hover:border-emerald-500 dark:hover:border-emerald-400',
  },
  tiktok: {
    name: 'TikTok',
    icon: Music,
    chipClass: 'bg-white/80 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 shadow-2xs',
    badgeClass: 'bg-transparent text-neutral-900 dark:text-white',
    glowClass: 'shadow-cyan-500/10',
    hoverClass: 'hover:border-cyan-500 dark:hover:border-cyan-400',
  },
  website: {
    name: 'Website',
    icon: Globe,
    chipClass: 'bg-white/80 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 shadow-2xs',
    badgeClass: 'bg-transparent text-amber-600',
    glowClass: 'shadow-amber-500/10',
    hoverClass: 'hover:border-amber-500 dark:hover:border-amber-400',
  }
};

// Favicon / Brand Logo Component with automatic fallback
const FaviconIcon: React.FC<{
  hostName: string;
  FallbackIcon: any;
  className?: string;
}> = ({ hostName, FallbackIcon, className = 'w-3.5 h-3.5' }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !hostName) {
    return <FallbackIcon className={className} />;
  }

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostName)}&sz=64`;

  return (
    <img
      src={faviconUrl}
      alt={hostName}
      onError={() => setHasError(true)}
      className={`${className} object-contain rounded-xs shrink-0 inline-block`}
    />
  );
};

function removeEmojis(str: string = ''): string {
  return str.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
}

export const SponsorBadge: React.FC<SponsorBadgeProps> = ({
  userId,
  username,
  rank = 0,
  sponsorUrl,
  sponsorText,
  sponsorClicks,
  isCurrentUser = false,
  isKing = false,
  size = 'md',
  showEmptyState = true,
  onOpenSponsorModal,
  className = ''
}) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const hasSponsor = !!sponsorUrl;

  const handleClickTracking = () => {
    if (userId) {
      trackSponsorClick(userId).catch(() => {});
    }
  };

  // If NO sponsor is configured for this row:
  if (!hasSponsor) {
    if (!showEmptyState) return null;

    // Direct CTA for current user or prospective sponsors
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenSponsorModal?.();
        }}
        className={`group inline-flex items-center gap-1 text-[9px] font-bold text-neutral-400 dark:text-neutral-500 hover:text-amber-700 dark:hover:text-amber-300 bg-neutral-100/70 hover:bg-amber-100/60 dark:bg-neutral-800/60 dark:hover:bg-amber-950/40 border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-amber-400 dark:hover:border-amber-600 px-2 py-0.5 rounded-full transition-all cursor-pointer ${className}`}
        title={t('Promote your brand / link in this room', 'Promociona tu marca o enlace en esta sala')}
      >
        <Megaphone className="w-2.5 h-2.5 group-hover:scale-110 group-hover:text-amber-500 transition-transform" />
        <span className="truncate">
          {isCurrentUser ? t('+ Anunciar', '+ Anunciar') : t('Anúnciate', 'Anúnciate')}
        </span>
      </button>
    );
  }

  const cleanUrl = sponsorUrl.startsWith('http') ? sponsorUrl : `https://${sponsorUrl}`;
  let hostName = '';
  try {
    hostName = new URL(cleanUrl).hostname.replace(/^www\./, '');
  } catch {
    hostName = sponsorUrl;
  }

  const platform = detectPlatform(sponsorUrl, sponsorText);
  const config = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.website;
  const PlatformIcon = config.icon;
  const isRankOne = isKing || rank === 1;

  const rawText = sponsorText || config.name;
  const displayText = removeEmojis(rawText) || config.name;

  return (
    <div 
      ref={containerRef} 
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* 1. Interactive Platform Chip */}
      <a
        href={cleanUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          e.stopPropagation();
          handleClickTracking();
        }}
        className={`group relative inline-flex items-center gap-1.5 font-black border transition-all duration-200 cursor-pointer shadow-xs select-none ${
          isRankOne
            ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-amber-950 dark:from-amber-400 dark:via-yellow-300 dark:to-amber-500 dark:text-amber-950 border-amber-400 px-3 py-1 rounded-full ring-2 ring-amber-300/60 shadow-amber-500/30 hover:scale-[1.03] hover:shadow-md'
            : `${config.chipClass} ${config.hoverClass} px-2.5 py-1 rounded-full text-xs hover:scale-[1.02]`
        }`}
        title={t(`Sponsored by ${username}: ${displayText}`, `Patrocinado por ${username}: ${displayText}`)}
      >
        {isRankOne ? (
          <div className="flex items-center gap-1 shrink-0">
            <Crown className="w-3.5 h-3.5 text-amber-950 fill-amber-950 shrink-0" />
            <RealtimeBrandLogo platform={platform} sponsorUrl={sponsorUrl} size={16} />
          </div>
        ) : (
          <RealtimeBrandLogo platform={platform} sponsorUrl={sponsorUrl} size={16} className="transition-transform group-hover:scale-110" />
        )}

        <span className="truncate max-w-[130px] sm:max-w-[180px] text-xs font-black tracking-tight">
          {displayText}
        </span>

        <ExternalLink className="w-3 h-3 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
      </a>

      {/* 2. Interactive Rich Hover Card / Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white dark:bg-[#1f1f23] border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-xl z-50 p-3.5 space-y-2.5 text-left animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 flex items-center justify-center shrink-0">
                <RealtimeBrandLogo platform={platform} sponsorUrl={sponsorUrl} size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-extrabold text-xs text-neutral-900 dark:text-white truncate flex items-center gap-1">
                  <span>{displayText}</span>
                  <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                </div>
                <div className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate font-semibold">
                  {hostName}
                </div>
              </div>
            </div>

            {isRankOne && (
              <span className="text-[9px] bg-amber-400 text-amber-950 font-black px-1.5 py-0.5 rounded-full shrink-0">
                #1 KING
              </span>
            )}
          </div>

          {/* Body stats & user notice */}
          <div className="text-[11px] text-neutral-600 dark:text-neutral-300 font-medium leading-relaxed">
            {isRankOne ? (
              <p className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{t('Official Room Sponsor', 'Patrocinador Oficial de la Sala')}</span>
              </p>
            ) : (
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                {t(`Promoted by ${username} in this room.`, `Promocionado por ${username} en esta sala.`)}
              </p>
            )}

            {/* Click Metrics Badge */}
            {typeof sponsorClicks === 'number' && sponsorClicks > 0 && (
              <div className="mt-2 inline-flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-lg text-[10px] font-bold text-neutral-700 dark:text-neutral-300">
                <Eye className="w-3 h-3 text-amber-500" />
                <span>{sponsorClicks} {t('clicks received', 'visitas recibidas')}</span>
              </div>
            )}
          </div>

          {/* Action CTA Button */}
          <a
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClickTracking}
            className="w-full py-2 bg-neutral-950 hover:bg-neutral-800 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-neutral-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <span>{t('Visit Link', 'Visitar Enlace')}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Decorative Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2.5 h-2.5 bg-white dark:bg-[#1f1f23] border-r border-b border-neutral-200 dark:border-neutral-700 rotate-45" />
        </div>
      )}
    </div>
  );
};
