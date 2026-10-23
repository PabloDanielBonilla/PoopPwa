import React, { useState } from 'react';

interface RealtimeBrandLogoProps {
  platform?: string;
  sponsorUrl?: string;
  customLogoUrl?: string;
  size?: number;
  className?: string;
}

interface PlatformConfig {
  domain: string;
  slug: string;
  color: string;
  invertDark?: boolean;
}

const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  // Social & Streaming
  kick: { domain: 'kick.com', slug: 'kick', color: '53FC18' },
  instagram: { domain: 'instagram.com', slug: 'instagram', color: 'E4405F' },
  youtube: { domain: 'youtube.com', slug: 'youtube', color: 'FF0000' },
  twitch: { domain: 'twitch.tv', slug: 'twitch', color: '9146FF' },
  twitter: { domain: 'x.com', slug: 'x', color: 'ffffff', invertDark: false },
  x: { domain: 'x.com', slug: 'x', color: 'ffffff', invertDark: false },
  facebook: { domain: 'facebook.com', slug: 'facebook', color: '1877F2' },
  tiktok: { domain: 'tiktok.com', slug: 'tiktok', color: '000000', invertDark: true },
  reddit: { domain: 'reddit.com', slug: 'reddit', color: 'FF4500' },
  pinterest: { domain: 'pinterest.com', slug: 'pinterest', color: 'E60023' },
  snapchat: { domain: 'snapchat.com', slug: 'snapchat', color: 'FFFC00' },
  threads: { domain: 'threads.net', slug: 'threads', color: '000000', invertDark: true },
  bluesky: { domain: 'bsky.app', slug: 'bluesky', color: '0085FF' },
  mastodon: { domain: 'mastodon.social', slug: 'mastodon', color: '6364FF' },
  tumblr: { domain: 'tumblr.com', slug: 'tumblr', color: '36465D' },

  // Messaging & Community
  whatsapp: { domain: 'whatsapp.com', slug: 'whatsapp', color: '25D366' },
  telegram: { domain: 'telegram.org', slug: 'telegram', color: '26A5E4' },
  discord: { domain: 'discord.com', slug: 'discord', color: '5865F2' },
  slack: { domain: 'slack.com', slug: 'slack', color: '4A154B' },
  signal: { domain: 'signal.org', slug: 'signal', color: '3A76F0' },

  // AI, Tech, Cloud & Dev
  google: { domain: 'google.com', slug: 'google', color: '4285F4' },
  openai: { domain: 'openai.com', slug: 'openai', color: '10A37F' },
  chatgpt: { domain: 'chatgpt.com', slug: 'openai', color: '10A37F' },
  gpt: { domain: 'chatgpt.com', slug: 'openai', color: '10A37F' },
  anthropic: { domain: 'anthropic.com', slug: 'anthropic', color: 'D97757' },
  claude: { domain: 'claude.ai', slug: 'anthropic', color: 'D97757' },
  perplexity: { domain: 'perplexity.ai', slug: 'perplexity', color: '20B2AA' },
  deepseek: { domain: 'deepseek.com', slug: 'deepseek', color: '1D53F7' },
  mistral: { domain: 'mistral.ai', slug: 'mistral', color: 'FF7000' },
  midjourney: { domain: 'midjourney.com', slug: 'midjourney', color: '000000', invertDark: true },
  elevenlabs: { domain: 'elevenlabs.io', slug: 'elevenlabs', color: '000000', invertDark: true },
  gemini: { domain: 'gemini.google.com', slug: 'googlegemini', color: '8E75FF' },
  microsoft: { domain: 'microsoft.com', slug: 'microsoft', color: '5E5E5E' },
  apple: { domain: 'apple.com', slug: 'apple', color: '000000', invertDark: true },
  nvidia: { domain: 'nvidia.com', slug: 'nvidia', color: '76B900' },
  tesla: { domain: 'tesla.com', slug: 'tesla', color: 'E82127' },
  github: { domain: 'github.com', slug: 'github', color: '181717', invertDark: true },
  gitlab: { domain: 'gitlab.com', slug: 'gitlab', color: 'FC6D26' },
  vercel: { domain: 'vercel.com', slug: 'vercel', color: '000000', invertDark: true },
  netlify: { domain: 'netlify.com', slug: 'netlify', color: '00C7B7' },
  supabase: { domain: 'supabase.com', slug: 'supabase', color: '3ECF8E' },
  aws: { domain: 'aws.amazon.com', slug: 'amazonwebservices', color: '232F3E' },
  googlecloud: { domain: 'cloud.google.com', slug: 'googlecloud', color: '4285F4' },
  azure: { domain: 'azure.microsoft.com', slug: 'microsoftazure', color: '0078D4' },
  cloudflare: { domain: 'cloudflare.com', slug: 'cloudflare', color: 'F38020' },
  docker: { domain: 'docker.com', slug: 'docker', color: '2496ED' },
  mongodb: { domain: 'mongodb.com', slug: 'mongodb', color: '47A248' },
  postman: { domain: 'postman.com', slug: 'postman', color: 'FF6C37' },
  sentry: { domain: 'sentry.io', slug: 'sentry', color: '362D59' },
  datadog: { domain: 'datadoghq.com', slug: 'datadog', color: '632CA6' },
  digitalocean: { domain: 'digitalocean.com', slug: 'digitalocean', color: '0080FF' },
  heroku: { domain: 'heroku.com', slug: 'heroku', color: '430098' },
  linear: { domain: 'linear.app', slug: 'linear', color: '5E6AD2' },
  cursor: { domain: 'cursor.com', slug: 'cursor', color: '000000', invertDark: true },
  replit: { domain: 'replit.com', slug: 'replit', color: 'F26207' },
  huggingface: { domain: 'huggingface.co', slug: 'huggingface', color: 'FFD21E' },

  // Content, Music & Video
  spotify: { domain: 'spotify.com', slug: 'spotify', color: '1ED760' },
  soundcloud: { domain: 'soundcloud.com', slug: 'soundcloud', color: 'FF5500' },
  'apple-music': { domain: 'music.apple.com', slug: 'applemusic', color: 'FA243C' },
  applemusic: { domain: 'music.apple.com', slug: 'applemusic', color: 'FA243C' },
  deezer: { domain: 'deezer.com', slug: 'deezer', color: 'FEAA2D' },
  tidal: { domain: 'tidal.com', slug: 'tidal', color: '000000', invertDark: true },
  pandora: { domain: 'pandora.com', slug: 'pandora', color: '224099' },
  shazam: { domain: 'shazam.com', slug: 'shazam', color: '0088FF' },
  substack: { domain: 'substack.com', slug: 'substack', color: 'FF6600' },
  newsletter: { domain: 'substack.com', slug: 'substack', color: 'FF6600' },
  medium: { domain: 'medium.com', slug: 'medium', color: '000000', invertDark: true },
  netflix: { domain: 'netflix.com', slug: 'netflix', color: 'E50914' },
  hbo: { domain: 'max.com', slug: 'hbo', color: '000000', invertDark: true },
  max: { domain: 'max.com', slug: 'max', color: '002BE7' },
  disneyplus: { domain: 'disneyplus.com', slug: 'disneyplus', color: '113CCF' },
  primevideo: { domain: 'primevideo.com', slug: 'primevideo', color: '00A8E1' },
  crunchyroll: { domain: 'crunchyroll.com', slug: 'crunchyroll', color: 'F47521' },
  vimeo: { domain: 'vimeo.com', slug: 'vimeo', color: '1AB7EA' },
  rumble: { domain: 'rumble.com', slug: 'rumble', color: '85C742' },

  // E-Commerce, Creator & Business
  shopify: { domain: 'shopify.com', slug: 'shopify', color: '7AB55C' },
  stripe: { domain: 'stripe.com', slug: 'stripe', color: '635BFF' },
  paypal: { domain: 'paypal.com', slug: 'paypal', color: '003087' },
  amazon: { domain: 'amazon.com', slug: 'amazon', color: 'FF9900' },
  mercadolibre: { domain: 'mercadolibre.com', slug: 'mercadolibre', color: 'FFE600' },
  patreon: { domain: 'patreon.com', slug: 'patreon', color: 'FF424D' },
  onlyfans: { domain: 'onlyfans.com', slug: 'onlyfans', color: '00AFF0' },
  buymeacoffee: { domain: 'buymeacoffee.com', slug: 'buymeacoffee', color: 'FFDD00' },
  kofi: { domain: 'ko-fi.com', slug: 'kofi', color: 'FF5E5B' },
  etsy: { domain: 'etsy.com', slug: 'etsy', color: 'F16521' },
  ebay: { domain: 'ebay.com', slug: 'ebay', color: 'E53238' },
  walmart: { domain: 'walmart.com', slug: 'walmart', color: '0071DC' },
  kickstarter: { domain: 'kickstarter.com', slug: 'kickstarter', color: '05CE78' },
  indiegogo: { domain: 'indiegogo.com', slug: 'indiegogo', color: 'EB1478' },
  gumroad: { domain: 'gumroad.com', slug: 'gumroad', color: 'FF90E8' },
  linkedin: { domain: 'linkedin.com', slug: 'linkedin', color: '0A66C2' },
  notion: { domain: 'notion.so', slug: 'notion', color: '000000', invertDark: true },
  figma: { domain: 'figma.com', slug: 'figma', color: 'F24E1E' },
  canva: { domain: 'canva.com', slug: 'canva', color: '00C4CC' },
  adobe: { domain: 'adobe.com', slug: 'adobe', color: 'FF0000' },
  photoshop: { domain: 'adobe.com/photoshop', slug: 'adobephotoshop', color: '31A8FF' },
  blender: { domain: 'blender.org', slug: 'blender', color: 'EA7600' },
  dribbble: { domain: 'dribbble.com', slug: 'dribbble', color: 'EA4C89' },
  behance: { domain: 'behance.net', slug: 'behance', color: '1769FF' },
  unsplash: { domain: 'unsplash.com', slug: 'unsplash', color: '000000', invertDark: true },
  fiverr: { domain: 'fiverr.com', slug: 'fiverr', color: '1DBF73' },
  upwork: { domain: 'upwork.com', slug: 'upwork', color: '14A800' },
  trello: { domain: 'trello.com', slug: 'trello', color: '0052CC' },
  asana: { domain: 'asana.com', slug: 'asana', color: 'F95738' },

  // Crypto & Fintech
  binance: { domain: 'binance.com', slug: 'binance', color: 'F0B90B' },
  coinbase: { domain: 'coinbase.com', slug: 'coinbase', color: '0052FF' },
  bitcoin: { domain: 'bitcoin.org', slug: 'bitcoin', color: 'F7931A' },
  ethereum: { domain: 'ethereum.org', slug: 'ethereum', color: '3C3C3D' },
  solana: { domain: 'solana.com', slug: 'solana', color: '9945FF' },
  metamask: { domain: 'metamask.io', slug: 'metamask', color: 'E2761B' },
  opensea: { domain: 'opensea.io', slug: 'opensea', color: '2081E2' },
  kraken: { domain: 'kraken.com', slug: 'kraken', color: '5741D9' },
  uniswap: { domain: 'uniswap.org', slug: 'uniswap', color: 'FF007A' },
  trustwallet: { domain: 'trustwallet.com', slug: 'trust', color: '3375BB' },
  polygon: { domain: 'polygon.technology', slug: 'polygon', color: '8247E5' },
  revolut: { domain: 'revolut.com', slug: 'revolut', color: '0075FF' },
  wise: { domain: 'wise.com', slug: 'wise', color: '163300' },
  nubank: { domain: 'nubank.com.br', slug: 'nubank', color: '820AD1' },
  mercadopago: { domain: 'mercadopago.com', slug: 'mercadopago', color: '009EE3' },
  venmo: { domain: 'venmo.com', slug: 'venmo', color: '008CFF' },
  cashapp: { domain: 'cash.app', slug: 'cashapp', color: '00D632' },

  // Gaming
  steam: { domain: 'store.steampowered.com', slug: 'steam', color: '000000', invertDark: true },
  roblox: { domain: 'roblox.com', slug: 'roblox', color: '000000', invertDark: true },
  epicgames: { domain: 'epicgames.com', slug: 'epicgames', color: '313131', invertDark: true },
  playstation: { domain: 'playstation.com', slug: 'playstation', color: '003791' },
  xbox: { domain: 'xbox.com', slug: 'xbox', color: '107C41' },
  nintendo: { domain: 'nintendo.com', slug: 'nintendo', color: 'E60012' },
  riotgames: { domain: 'riotgames.com', slug: 'riotgames', color: 'D32936' },
  leagueoflegends: { domain: 'leagueoflegends.com', slug: 'leagueoflegends', color: 'C19A5B' },
  valorant: { domain: 'playvalorant.com', slug: 'valorant', color: 'FF4655' },
  fortnite: { domain: 'fortnite.com', slug: 'fortnite', color: '000000', invertDark: true },
  minecraft: { domain: 'minecraft.net', slug: 'minecraft', color: '62B435' },
  ea: { domain: 'ea.com', slug: 'ea', color: 'FF4747' },
  ubisoft: { domain: 'ubisoft.com', slug: 'ubisoft', color: '000000', invertDark: true },
  unity: { domain: 'unity.com', slug: 'unity', color: '000000', invertDark: true },
  unrealengine: { domain: 'unrealengine.com', slug: 'unrealengine', color: '0E1128', invertDark: true },

  // Mobility, Food & Travel
  uber: { domain: 'uber.com', slug: 'uber', color: '000000', invertDark: true },
  ubereats: { domain: 'ubereats.com', slug: 'ubereats', color: '06C167' },
  rappi: { domain: 'rappi.com', slug: 'rappi', color: 'FF441F' },
  doordash: { domain: 'doordash.com', slug: 'doordash', color: 'FF3008' },
  grubhub: { domain: 'grubhub.com', slug: 'grubhub', color: 'F6343F' },
  pedidosya: { domain: 'pedidosya.com', slug: 'pedidosya', color: 'EA0029' },
  lyft: { domain: 'lyft.com', slug: 'lyft', color: 'FF00BF' },
  airbnb: { domain: 'airbnb.com', slug: 'airbnb', color: 'FF5A5F' },
  booking: { domain: 'booking.com', slug: 'bookingdotcom', color: '003580' },
  tripadvisor: { domain: 'tripadvisor.com', slug: 'tripadvisor', color: '00AF87' },

  // Fashion & Brands
  nike: { domain: 'nike.com', slug: 'nike', color: '000000', invertDark: true },
  adidas: { domain: 'adidas.com', slug: 'adidas', color: '000000', invertDark: true },
  puma: { domain: 'puma.com', slug: 'puma', color: '000000', invertDark: true },
  supreme: { domain: 'supremenewyork.com', slug: 'supreme', color: 'FF0000' },
  zara: { domain: 'zara.com', slug: 'zara', color: '000000', invertDark: true },
  redbull: { domain: 'redbull.com', slug: 'redbull', color: 'DB0A40' },
  cocacola: { domain: 'coca-cola.com', slug: 'cocacola', color: 'F40009' },
  pepsi: { domain: 'pepsi.com', slug: 'pepsi', color: '005CB4' },

  company: { domain: 'google.com', slug: 'google', color: '4285F4' },
};

function extractDomainFromUrl(sponsorUrl: string = ''): string {
  if (!sponsorUrl || typeof sponsorUrl !== 'string') return '';
  try {
    const trimmed = sponsorUrl.trim();
    if (!trimmed) return '';
    const cleanUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
    const parsed = new URL(cleanUrl);
    let host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    if (host && !host.includes('.')) {
      host = `${host}.com`;
    }
    return host;
  } catch {
    const raw = sponsorUrl.trim().toLowerCase().replace(/^www\./, '');
    if (raw && !raw.includes('.')) return `${raw}.com`;
    return raw;
  }
}

export function detectBrandConfig(platformStr: string = '', sponsorUrl: string = ''): { config: PlatformConfig | null; domain: string } {
  const p = (platformStr || '').toLowerCase().trim();
  const url = (sponsorUrl || '').toLowerCase().trim();
  const extractedDomain = extractDomainFromUrl(sponsorUrl);

  const isMatch = (brandKey: string, domainSubstrings: string[]) => {
    if (p === brandKey || p.includes(brandKey)) return true;
    if (domainSubstrings.some(d => extractedDomain.includes(d) || url.includes(d))) return true;
    return false;
  };

  // 1. Google
  if (isMatch('google', ['google.com', 'google.es', 'google.co', 'google.net', 'google.cl', 'google.com.mx'])) {
    return { config: PLATFORM_CONFIGS.google, domain: 'google.com' };
  }

  // 2. OpenAI / ChatGPT
  if (isMatch('chatgpt', ['chatgpt.com', 'chat.openai.com']) || isMatch('gpt', ['chatgpt.com'])) {
    return { config: PLATFORM_CONFIGS.chatgpt, domain: 'chatgpt.com' };
  }
  if (isMatch('openai', ['openai.com'])) {
    return { config: PLATFORM_CONFIGS.openai, domain: 'openai.com' };
  }

  // 3. Anthropic / Claude
  if (isMatch('claude', ['claude.ai']) || isMatch('anthropic', ['anthropic.com'])) {
    return { config: PLATFORM_CONFIGS.claude, domain: 'claude.ai' };
  }

  // 4. Perplexity
  if (isMatch('perplexity', ['perplexity.ai'])) {
    return { config: PLATFORM_CONFIGS.perplexity, domain: 'perplexity.ai' };
  }

  // 5. DeepSeek
  if (isMatch('deepseek', ['deepseek.com'])) {
    return { config: PLATFORM_CONFIGS.deepseek, domain: 'deepseek.com' };
  }

  // 6. Kick
  if (isMatch('kick', ['kick.com'])) {
    return { config: PLATFORM_CONFIGS.kick, domain: 'kick.com' };
  }

  // 7. Instagram
  if (isMatch('instagram', ['instagram.com', 'instagr.am'])) {
    return { config: PLATFORM_CONFIGS.instagram, domain: 'instagram.com' };
  }

  // 8. YouTube
  if (isMatch('youtube', ['youtube.com', 'youtu.be'])) {
    return { config: PLATFORM_CONFIGS.youtube, domain: 'youtube.com' };
  }

  // 9. Facebook
  if (isMatch('facebook', ['facebook.com', 'fb.com', 'fb.watch'])) {
    return { config: PLATFORM_CONFIGS.facebook, domain: 'facebook.com' };
  }

  // 10. WhatsApp
  if (isMatch('whatsapp', ['whatsapp.com', 'wa.me'])) {
    return { config: PLATFORM_CONFIGS.whatsapp, domain: 'whatsapp.com' };
  }

  // 11. X / Twitter
  if (isMatch('twitter', ['twitter.com']) || isMatch('x', ['x.com'])) {
    return { config: PLATFORM_CONFIGS.x, domain: 'x.com' };
  }

  // 12. Twitch
  if (isMatch('twitch', ['twitch.tv'])) {
    return { config: PLATFORM_CONFIGS.twitch, domain: 'twitch.tv' };
  }

  // 13. TikTok
  if (isMatch('tiktok', ['tiktok.com'])) {
    return { config: PLATFORM_CONFIGS.tiktok, domain: 'tiktok.com' };
  }

  // 14. GitHub
  if (isMatch('github', ['github.com', 'github.io'])) {
    return { config: PLATFORM_CONFIGS.github, domain: 'github.com' };
  }

  // 15. Spotify
  if (isMatch('spotify', ['spotify.com'])) {
    return { config: PLATFORM_CONFIGS.spotify, domain: 'spotify.com' };
  }

  // 16. Discord
  if (isMatch('discord', ['discord.com', 'discord.gg'])) {
    return { config: PLATFORM_CONFIGS.discord, domain: 'discord.com' };
  }

  // 17. Telegram
  if (isMatch('telegram', ['telegram.org', 't.me'])) {
    return { config: PLATFORM_CONFIGS.telegram, domain: 'telegram.org' };
  }

  // 18. LinkedIn
  if (isMatch('linkedin', ['linkedin.com'])) {
    return { config: PLATFORM_CONFIGS.linkedin, domain: 'linkedin.com' };
  }

  // 19. Reddit
  if (isMatch('reddit', ['reddit.com'])) {
    return { config: PLATFORM_CONFIGS.reddit, domain: 'reddit.com' };
  }

  // 20. Pinterest
  if (isMatch('pinterest', ['pinterest.com'])) {
    return { config: PLATFORM_CONFIGS.pinterest, domain: 'pinterest.com' };
  }

  // 21. Slack
  if (isMatch('slack', ['slack.com'])) {
    return { config: PLATFORM_CONFIGS.slack, domain: 'slack.com' };
  }

  // 22. Notion
  if (isMatch('notion', ['notion.so', 'notion.site'])) {
    return { config: PLATFORM_CONFIGS.notion, domain: 'notion.so' };
  }

  // 23. Shopify
  if (isMatch('shopify', ['shopify.com', 'myshopify.com'])) {
    return { config: PLATFORM_CONFIGS.shopify, domain: 'shopify.com' };
  }

  // 24. Stripe
  if (isMatch('stripe', ['stripe.com'])) {
    return { config: PLATFORM_CONFIGS.stripe, domain: 'stripe.com' };
  }

  // 25. Amazon
  if (isMatch('amazon', ['amazon.com', 'amzn.to'])) {
    return { config: PLATFORM_CONFIGS.amazon, domain: 'amazon.com' };
  }

  // Check remaining keys in PLATFORM_CONFIGS
  for (const key of Object.keys(PLATFORM_CONFIGS)) {
    if (key !== 'company' && (p === key || (extractedDomain && extractedDomain.includes(key)))) {
      return { config: PLATFORM_CONFIGS[key], domain: PLATFORM_CONFIGS[key].domain || extractedDomain || `${key}.com` };
    }
  }

  // Generic fallback domain if URL exists
  const activeDomain = extractedDomain || (p && p !== 'company' ? (p.includes('.') ? p : `${p.replace(/[^a-z0-9]/g, '')}.com`) : 'google.com');

  return { config: null, domain: activeDomain };
}

export const RealtimeBrandLogo: React.FC<RealtimeBrandLogoProps> = ({
  platform = '',
  sponsorUrl = '',
  customLogoUrl,
  size = 20,
  className = '',
}) => {
  const [errorStep, setErrorStep] = useState(0);

  // Custom logo URL provided by user
  if (customLogoUrl && errorStep === 0) {
    return (
      <img
        src={customLogoUrl}
        alt="Custom Logo"
        style={{ width: size, height: size }}
        onError={() => setErrorStep(1)}
        className={`rounded-md object-cover shrink-0 ${className}`}
      />
    );
  }

  const { config, domain } = detectBrandConfig(platform, sponsorUrl);

  const cleanFullUrl = sponsorUrl ? (sponsorUrl.trim().startsWith('http') ? sponsorUrl.trim() : `https://${sponsorUrl.trim()}`) : '';

  // Multi-tier CDN fallback chain:
  // Step 0: Google Favicon API direct from user's full link
  // Step 1: Google Favicon API direct from extracted domain
  // Step 2: SimpleIcons vector logo if available
  // Step 3: DuckDuckGo Icons API
  // Step 4: Clearbit Logo API
  let logoSrc = '';
  if (errorStep === 0 && cleanFullUrl) {
    logoSrc = `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(cleanFullUrl)}&sz=128`;
  } else if (errorStep <= 1 && domain) {
    logoSrc = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
  } else if (errorStep === 2 && config?.slug) {
    logoSrc = `https://cdn.simpleicons.org/${config.slug}/${config.color}`;
  } else if (errorStep === 3 && domain) {
    logoSrc = `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`;
  } else if (errorStep === 4 && domain) {
    logoSrc = `https://logo.clearbit.com/${encodeURIComponent(domain)}`;
  }

  const shouldInvertDark = config?.invertDark || false;

  if (errorStep >= 5 || !logoSrc) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`rounded-md bg-amber-400 text-neutral-950 font-black text-[10px] flex items-center justify-center shrink-0 border border-amber-300 shadow-2xs ${className}`}
      >
        {(platform || domain || 'AD').substring(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`shrink-0 flex items-center justify-center overflow-hidden rounded-md ${className}`}
    >
      <img
        src={logoSrc}
        alt={`${platform || domain} logo`}
        style={{ width: size, height: size }}
        onError={() => setErrorStep(prev => prev + 1)}
        className={`object-contain shrink-0 ${shouldInvertDark ? 'dark:invert dark:brightness-200' : ''}`}
        loading="lazy"
      />
    </div>
  );
};

export function renderBrandLogo(
  platform: string = '',
  size: number = 20,
  customLogoUrl?: string,
  sponsorUrl?: string
) {
  return (
    <RealtimeBrandLogo
      platform={platform}
      sponsorUrl={sponsorUrl}
      customLogoUrl={customLogoUrl}
      size={size}
    />
  );
}
