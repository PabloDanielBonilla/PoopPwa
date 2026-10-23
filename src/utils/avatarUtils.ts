import { createAvatar } from '@dicebear/core';
import { toonHead } from '@dicebear/collection';
export const REALISTIC_AVATARS: Record<string, string> = {
  'Mateo Rossi': 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'Liam Tremblay': 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'Oliver Smith': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'Jack Miller': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'Sofia Navarro': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'Lucas Vance': 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  'Alejandro Morales': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  'Gabriel Silva': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'Maximilian Weber': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  'Camille Dupont': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'Camille Laurent': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'Yuki Tanaka': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'Carlos Méndez': 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80',
  'Hans Gruber': 'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=150&auto=format&fit=crop&q=80',
  'Thiago Santos': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'Alex Rivera': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
};

export const CURATED_PORTRAITS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1548142813-c348350df52b?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=150&auto=format&fit=crop&q=80',
];

// Rich, modern designer gradients for monogram icon fallback
export interface MonogramGradient {
  id: string;
  name: string;
  gradient: string;
  previewBg: string;
}

export const MONOGRAM_GRADIENTS: MonogramGradient[] = [
  {
    id: 'sunset-amber',
    name: 'Sunset Amber',
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 50%, #FFA07A 100%)',
    previewBg: '#FF8E53'
  },
  {
    id: 'neon-violet',
    name: 'Neon Violet',
    gradient: 'linear-gradient(135deg, #7F00FF 0%, #E100FF 100%)',
    previewBg: '#A020F0'
  },
  {
    id: 'emerald-teal',
    name: 'Emerald Teal',
    gradient: 'linear-gradient(135deg, #0575E6 0%, #00F260 100%)',
    previewBg: '#059669'
  },
  {
    id: 'ocean-cyan',
    name: 'Ocean Cyan',
    gradient: 'linear-gradient(135deg, #0284C7 0%, #38BDF8 50%, #22D3EE 100%)',
    previewBg: '#0284C7'
  },
  {
    id: 'cosmic-berry',
    name: 'Cosmic Berry',
    gradient: 'linear-gradient(135deg, #8A2387 0%, #E94057 50%, #F27121 100%)',
    previewBg: '#E94057'
  },
  {
    id: 'amber-gold',
    name: 'Royal Gold',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #B45309 100%)',
    previewBg: '#F59E0B'
  },
  {
    id: 'rose-fuchsia',
    name: 'Rose Fuchsia',
    gradient: 'linear-gradient(135deg, #F43F5E 0%, #FB7185 50%, #FDA4AF 100%)',
    previewBg: '#F43F5E'
  },
  {
    id: 'cyber-mint',
    name: 'Cyber Mint',
    gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 50%, #6EE7B7 100%)',
    previewBg: '#10B981'
  },
  {
    id: 'royal-indigo',
    name: 'Royal Indigo',
    gradient: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
    previewBg: '#6366F1'
  },
  {
    id: 'crimson-fire',
    name: 'Crimson Flame',
    gradient: 'linear-gradient(135deg, #DC2626 0%, #EA580C 100%)',
    previewBg: '#DC2626'
  },
];

// WhatsApp & Material avatar background palette
export const WHATSAPP_AVATAR_COLORS = [
  { name: 'WhatsApp Green', hex: '#25D366' },
  { name: 'Teal Forest', hex: '#0D9488' },
  { name: 'Ocean Blue', hex: '#0284C7' },
  { name: 'Royal Indigo', hex: '#4F46E5' },
  { name: 'Vibrant Purple', hex: '#9333EA' },
  { name: 'Warm Rose', hex: '#E11D48' },
  { name: 'Sunset Orange', hex: '#EA580C' },
  { name: 'Amber Gold', hex: '#D97706' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Charcoal Slate', hex: '#334155' },
];

export function getInitialFromName(name?: string): string {
  if (!name || !name.trim()) return 'P';
  const clean = name.trim().replace(/^[@#_\s]+/, '');
  return (clean.charAt(0) || 'P').toUpperCase();
}

export function getDefaultGradientForName(name?: string): MonogramGradient {
  if (!name) return MONOGRAM_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % MONOGRAM_GRADIENTS.length;
  return MONOGRAM_GRADIENTS[index];
}

export function getDefaultColorForName(name?: string): string {
  if (!name) return '#25D366';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % WHATSAPP_AVATAR_COLORS.length;
  return WHATSAPP_AVATAR_COLORS[index].hex;
}

export function isLetterAvatar(avatar?: string): boolean {
  if (!avatar) return false;
  return (
    avatar.startsWith('letter:') ||
    avatar === 'letter' ||
    avatar.startsWith('monogram:') ||
    avatar === 'monogram'
  );
}

export function isCustomPhoto(avatar?: string): boolean {
  if (!avatar) return false;
  return avatar.startsWith('data:image/') || avatar.startsWith('blob:');
}

export interface ParsedMonogram {
  letter: string;
  background: string;
  bgColor: string; // fallback hex
  isGradient: boolean;
  styleId: string;
  name: string;
}

export function parseLetterAvatar(avatar?: string, username?: string): ParsedMonogram {
  const defaultLetter = getInitialFromName(username);
  const defaultGrad = getDefaultGradientForName(username);

  if (!avatar || (!avatar.startsWith('letter:') && !avatar.startsWith('monogram:'))) {
    return {
      letter: defaultLetter,
      background: defaultGrad.gradient,
      bgColor: defaultGrad.previewBg,
      isGradient: true,
      styleId: defaultGrad.id,
      name: defaultGrad.name,
    };
  }

  // Format can be:
  // - monogram:P:sunset-amber
  // - monogram:P:#25D366
  // - letter:P:#25D366
  // - letter:P
  const parts = avatar.split(':');
  const letterPart = parts[1]?.trim();
  const stylePart = parts[2]?.trim();

  const letter = (letterPart && letterPart.length > 0) ? letterPart.slice(0, 2).toUpperCase() : defaultLetter;

  if (stylePart) {
    // Check if it's a known gradient ID
    const matchedGrad = MONOGRAM_GRADIENTS.find((g) => g.id.toLowerCase() === stylePart.toLowerCase());
    if (matchedGrad) {
      return {
        letter,
        background: matchedGrad.gradient,
        bgColor: matchedGrad.previewBg,
        isGradient: true,
        styleId: matchedGrad.id,
        name: matchedGrad.name,
      };
    }

    // Check if it's a hex color
    if (stylePart.startsWith('#')) {
      const matchedSolid = WHATSAPP_AVATAR_COLORS.find((c) => c.hex.toLowerCase() === stylePart.toLowerCase());
      return {
        letter,
        background: stylePart,
        bgColor: stylePart,
        isGradient: false,
        styleId: stylePart,
        name: matchedSolid?.name || 'Solid Color',
      };
    }
  }

  return {
    letter,
    background: defaultGrad.gradient,
    bgColor: defaultGrad.previewBg,
    isGradient: true,
    styleId: defaultGrad.id,
    name: defaultGrad.name,
  };
}

export function createLetterAvatarString(letter: string, styleIdOrColor: string): string {
  const cleanLetter = (letter || 'P').trim().slice(0, 2).toUpperCase();
  const cleanStyle = styleIdOrColor.startsWith('#') ? styleIdOrColor : styleIdOrColor.trim();
  return `monogram:${cleanLetter}:${cleanStyle}`;
}

export function generateFallbackMonogram(username?: string, gradientOrColorId?: string): string {
  const letter = getInitialFromName(username);
  if (gradientOrColorId) {
    return createLetterAvatarString(letter, gradientOrColorId);
  }
  const defaultGrad = getDefaultGradientForName(username);
  return createLetterAvatarString(letter, defaultGrad.id);
}

const STYLE_MAP: Record<string, any> = {
  'toon-head': toonHead,
};

export interface ToonHeadPreset {
  id: string;
  name: string;
  seed: string;
}

export const TOON_HEAD_PRESETS: ToonHeadPreset[] = [
  { id: 'toon-1', name: 'Felix', seed: 'felix' },
  { id: 'toon-2', name: 'Charlie', seed: 'charlie' },
  { id: 'toon-3', name: 'Luna', seed: 'luna' },
  { id: 'toon-4', name: 'Milo', seed: 'milo' },
  { id: 'toon-5', name: 'Maya', seed: 'maya' },
  { id: 'toon-6', name: 'Leo', seed: 'leo' },
  { id: 'toon-7', name: 'Aria', seed: 'aria' },
  { id: 'toon-8', name: 'Zoe', seed: 'zoe' },
  { id: 'toon-9', name: 'Sam', seed: 'sam' },
  { id: 'toon-10', name: 'Alex', seed: 'alex' },
  { id: 'toon-11', name: 'Oliver', seed: 'oliver' },
  { id: 'toon-12', name: 'Sophia', seed: 'sophia' },
  { id: 'toon-13', name: 'Ethan', seed: 'ethan' },
  { id: 'toon-14', name: 'Mia', seed: 'mia' },
  { id: 'toon-15', name: 'Lucas', seed: 'lucas' },
  { id: 'toon-16', name: 'Emma', seed: 'emma' },
];

export const DICEBEAR_STYLES = [
  { id: 'toon-head', name: 'Toon Head', nameEs: 'Toon Head' },
];

export function getDiceBearAvatarSvg(seed: string = 'poop', style: string = 'toon-head'): string {
  const cleanSeed = (seed || 'poop').trim().toLowerCase();
  const selectedStyle = toonHead;
  try {
    const avatar = createAvatar(selectedStyle, {
      seed: cleanSeed,
    });
    return avatar.toString();
  } catch (e) {
    console.error('Error generating DiceBear SVG string:', e);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#f59e0b"/></svg>`;
  }
}

export function getDiceBearAvatar(seed: string = 'poop', style: string = 'toon-head'): string {
  const cleanSeed = (seed || 'poop').trim().toLowerCase();
  try {
    const avatar = createAvatar(toonHead, {
      seed: cleanSeed,
      backgroundColor: ['fde047', 'fef08a', 'fed7aa', 'bfdbfe', 'bbf7d0', 'fbcfe8', 'ddd6fe'],
    });
    return avatar.toDataUri();
  } catch (e) {
    console.error('Error generating DiceBear avatar dataUri:', e);
    return `https://api.dicebear.com/9.x/toon-head/svg?seed=${encodeURIComponent(cleanSeed)}&backgroundColor=fde047,fef08a,fed7aa,bfdbfe,bbf7d0,fbcfe8,ddd6fe`;
  }
}

export function getRandomDiceBearAvatar(customSeed?: string): string {
  // Always pick a random character from the curated TOON_HEAD_PRESETS in Profile Settings
  if (customSeed && customSeed.trim() !== '') {
    // Deterministic hash to map username consistently to one of the 16 toon presets if desired,
    // or pick randomly. We pick from TOON_HEAD_PRESETS to guarantee it's one of the exact characters shown in profile settings.
    const charCodeSum = customSeed.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
    const index = Math.abs(charCodeSum) % TOON_HEAD_PRESETS.length;
    const preset = TOON_HEAD_PRESETS[index];
    return getDiceBearAvatar(preset?.seed || 'felix', 'toon-head');
  }
  const randomIndex = Math.floor(Math.random() * TOON_HEAD_PRESETS.length);
  const preset = TOON_HEAD_PRESETS[randomIndex];
  return getDiceBearAvatar(preset?.seed || 'felix', 'toon-head');
}

export function getUserPhoto(username?: string, avatarProp?: string): string {
  if (avatarProp && avatarProp.trim() !== '') {
    const cleanAvatar = avatarProp.trim();
    // If it was one of the AI-generated jpg portrait photos or unsplash or google photo, upgrade to DiceBear toon head preset
    if (
      /^\/avatar[1-9]\d*\.jpg$/i.test(cleanAvatar) ||
      cleanAvatar.includes('images.unsplash.com') ||
      cleanAvatar.includes('googleusercontent.com')
    ) {
      return getRandomDiceBearAvatar(username);
    }
    if (cleanAvatar.startsWith('data:image/') || cleanAvatar.startsWith('http://') || cleanAvatar.startsWith('https://') || cleanAvatar.startsWith('/')) {
      return cleanAvatar;
    }
  }

  return getRandomDiceBearAvatar(username);
}

export interface AnimatedAvatarOption {
  id: string;
  name: string;
  nameEs: string;
  src: string;
  category: 'classic' | 'premium' | 'fun';
  badge?: string;
  descriptionEs: string;
}

export const OFFICIAL_ANIMATED_AVATARS: AnimatedAvatarOption[] = [
  {
    id: 'avatar1',
    name: 'Happy Boy',
    nameEs: 'Chico Feliz',
    src: '/avatar1.jpg',
    category: 'classic',
    badge: 'Top',
    descriptionEs: 'Un chico animado feliz estilo Pixar.',
  },
  {
    id: 'avatar2',
    name: 'Smiling Girl',
    nameEs: 'Chica Sonriente',
    src: '/avatar2.jpg',
    category: 'fun',
    badge: 'Alegre',
    descriptionEs: 'Una chica muy sonriente y amigable estilo Pixar.',
  },
  {
    id: 'avatar3',
    name: 'Cool Teen',
    nameEs: 'Adolescente Cool',
    src: '/avatar3.jpg',
    category: 'fun',
    badge: 'Cool',
    descriptionEs: 'Adolescente con estilo y gafas de sol.',
  },
  {
    id: 'avatar4',
    name: 'Gamer',
    nameEs: 'Gamer',
    src: '/avatar4.jpg',
    category: 'premium',
    badge: 'Pro',
    descriptionEs: 'Persona gamer con auriculares de neón.',
  },
  {
    id: 'avatar5',
    name: 'Cute Ninja',
    nameEs: 'Ninja Tierno',
    src: '/avatar5.jpg',
    category: 'fun',
    badge: 'Épico',
    descriptionEs: 'Ninja animado tierno estilo Pixar.',
  },
  {
    id: 'avatar6',
    name: 'Royal King',
    nameEs: 'Rey Real',
    src: '/avatar6.jpg',
    category: 'premium',
    badge: 'Rey',
    descriptionEs: 'Avatar épico de rey con corona dorada.',
  },
];

export function is3DPoopAvatar(avatar?: string): boolean {
  if (!avatar) return false;
  return OFFICIAL_ANIMATED_AVATARS.some((p) => p.src === avatar || p.id === avatar) ||
    avatar.startsWith('/avatar') ||
    avatar.startsWith('/popo') ||
    avatar === '/popo1.jpeg' ||
    avatar === '/popo2.jpeg';
}

export function mapModularTo3DPoop(avatarStr?: string): string {
  if (!avatarStr) return '/avatar1.jpg';
  if (avatarStr.includes('crown') || avatarStr.includes('King')) return '/avatar6.jpg';
  if (avatarStr.includes('gold')) return '/avatar6.jpg';
  if (avatarStr.includes('cool')) return '/avatar3.jpg';
  if (avatarStr.includes('ninja') || avatarStr.includes('toxic') || avatarStr.includes('horns')) return '/avatar5.jpg';
  if (avatarStr.includes('gamer') || avatarStr.includes('fly') || avatarStr.includes('sparkles')) return '/avatar4.jpg';
  return '/avatar1.jpg';
}

export interface PersonajilloAvatar {
  id: string;
  name: string;
  nameEs: string;
  src: string;
  badge?: string;
}

export const PERSONAJILLO_AVATARS: PersonajilloAvatar[] = [
  { id: 'mascot', name: 'Golden Mascot', nameEs: 'Mascota Real', src: '/popohero1_transparent.png?v=2', badge: 'Oficial' },
  { id: 'avatar1', name: 'Happy Drop', nameEs: 'Chico Feliz', src: '/avatar1.jpg', badge: 'Top' },
  { id: 'avatar2', name: 'Smiling Girl', nameEs: 'Chica Sonriente', src: '/avatar2.jpg', badge: 'Alegre' },
  { id: 'avatar3', name: 'Cool Teen', nameEs: 'Adolescente Cool', src: '/avatar3.jpg', badge: 'Cool' },
  { id: 'avatar4', name: 'Gamer', nameEs: 'Gamer', src: '/avatar4.jpg', badge: 'Pro' },
  { id: 'avatar5', name: 'Cute Ninja', nameEs: 'Ninja Tierno', src: '/avatar5.jpg', badge: 'Épico' },
  { id: 'avatar6', name: 'Royal King', nameEs: 'Rey Real', src: '/avatar6.jpg', badge: 'Rey' },
  ...TOON_HEAD_PRESETS.map((t) => ({
    id: t.id,
    name: t.name,
    nameEs: t.name,
    src: getDiceBearAvatar(t.seed, 'toon-head'),
  }))
];



