export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  country: string;
  countryCode: string;
  totalPoops: number;
  currentStreak: number;
  bestStreak: number;
  createdAt: string;
  isRegistered?: boolean;
  lastPoopAt?: string;
  statusBadge?: string;
  poopsToday?: number;
  poopsThisWeek?: number;
  dailyHistory?: { day?: string; date: string; count: number }[];
  royalDecree?: string;
  timezoneOffset?: number;
  sponsorUrl?: string;
  sponsorText?: string;
  isSponsored?: boolean;
  sponsorExpiresAt?: string;
  sponsorClicks?: number;
  platform?: string;
  groupIds?: string[];
}

export interface Poop {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  groupId?: string | null;
  note?: string;
  free?: boolean;
  createdAt: string;
  country: string;
  countryCode: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  category: 'count' | 'streak' | 'rank' | 'special';
  unlocked?: boolean;
  unlockedAt?: string;
  progress?: number;
}

export interface UserAchievement {
  userId: string;
  achievementId: string;
  unlockedAt: string;
}

export interface Championship {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  poopCount: number;
  daysAtTop: number;
  startedAt: string;
  endedAt: string | null;
  isCurrent?: boolean;
  royalDecree?: string;
}

export interface GlobalStats {
  totalPoops: number;
  totalUsers: number;
  poopersWorldwide: number;
  totalRooms: number;
  activeRooms: number;
  premiumRooms: number;
  poopsToday: number;
  countriesRepresented: number;
  lastPoopAt?: string | null;
  highestEver?: number;
}

export interface GroupMember {
  userId: string;
  username: string;
  avatar: string;
  countryCode: string;
  role: 'owner' | 'member';
  joinedAt: string;
  groupPoops: number;
  poopsToday?: number;
  poopsTodayDate?: string | null;
  poopsThisWeek?: number;
  poopsThisWeekDate?: string | null;
  timezoneOffset?: number;
  lastPoopAt?: string;
  rank?: number;
}

export interface GroupActivity {
  id: string;
  groupId: string;
  userId: string;
  username: string;
  avatar: string;
  note?: string;
  timestamp: string;
  timeAgo: string;
  poopsAdded: number;
}

export interface Group {
  id: string;
  name: string;
  code: string;
  description?: string;
  category: 'friends' | 'work' | 'school' | 'family' | 'other';
  avatar?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  members: GroupMember[];
  memberCount: number;
  totalPoops: number;
  isPrivate: boolean;
  activities: GroupActivity[];
  isVip?: boolean;
  vipExpiresAt?: string | null;
  vipSponsoredBy?: string;
  maxMembers?: number | null;
  royalDecree?: string;
  isPremium?: boolean;
  premium?: {
    status: 'none' | 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';
    plan: 'free' | 'monthly';
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
    polarSubscriptionId?: string | null;
    polarCustomerId?: string | null;
    polarProductId?: string | null;
    startedAt?: string | null;
    updatedAt?: string | null;
  };
  lastActivityAt?: string;
  isDemo?: boolean;
}

export type TimeframeFilter = 'all' | 'week' | 'today';

export interface MapPin {
  id: string;
  userId?: string;
  username: string;
  avatar: string;
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  totalPoops: number;
  timestamp: string;
  timeAgo: string;
  isRecent?: boolean;
  isKing?: boolean;
  isCurrentUser?: boolean;
  note?: string;
  cheers?: number;
}
