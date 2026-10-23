import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  LogIn, 
  Crown, 
  Copy, 
  Check, 
  X, 
  LogOut, 
  Trash2,
  AlertTriangle,
  Users,
  Radio,
  Sparkles,
  Scroll,
  BarChart3,
  Clock,
  Flame,
  ShieldCheck,
  ChevronRight,
  Bell,
  BellRing
} from 'lucide-react';
import { Group, GroupMember, User } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { CountryFlag } from './CountryFlag';
import { getUserPhoto, getDiceBearAvatar } from '../utils/avatarUtils';
import { showToast, requestWebPushPermission, getNotificationSettings, saveNotificationSettings } from '../utils/notificationService';
import { WhatsAppIcon } from './SocialIcons';
import {
  createRoom,
  deleteRoom,
  getMyRooms,
  getRoomByCode,
  joinRoom,
  leaveRoom,
  setDecree
} from '../lib/api';
import { getSupabase } from '../lib/supabase/client';
import { radarAudio } from '../utils/radarAudio';
import { RoomPremiumModal, isRoomPremium } from './RoomPremiumModal';

function hydrateGroup(id: string, data: any): Group {
  const memberCount = Array.isArray(data?.memberIds)
    ? data.memberIds.length
    : Array.isArray(data?.members)
      ? data.members.length
      : Number(data?.memberCount || 0);
  return {
    ...data,
    id,
    memberCount,
    members: Array.isArray(data?.members) ? data.members : [],
    activities: Array.isArray(data?.activities) ? data.activities : [],
    totalPoops: Number(data?.totalPoops || 0)
  } as Group;
}

function localDateKey(offsetMinutes: number, date = new Date()): string {
  return new Date(date.getTime() - offsetMinutes * 60_000).toISOString().slice(0, 10);
}

function localWeekStartKey(offsetMinutes: number, date = new Date()): string {
  const shifted = new Date(date.getTime() - offsetMinutes * 60_000);
  shifted.setUTCDate(shifted.getUTCDate() - 6);
  return shifted.toISOString().slice(0, 10);
}

// Stored per-member counts reset lazily when that member logs again. For
// display, treat yesterday's count as zero until the next poop refreshes it.
function withFreshTimeframes(member: GroupMember): GroupMember {
  const offset = Number(member.timezoneOffset || 0);
  const today = localDateKey(offset);
  const weekStart = localWeekStartKey(offset);
  return {
    ...member,
    poopsToday: member.poopsTodayDate === today ? Number(member.poopsToday || 0) : 0,
    poopsThisWeek:
      member.poopsThisWeekDate && member.poopsThisWeekDate >= weekStart
        ? Number(member.poopsThisWeek || 0)
        : 0
  };
}

interface GroupsSectionProps {
  currentUser: User | null;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onLogPoop: () => void;
  activeGroup?: Group | null;
  initialGroupCode?: string | null;
  onClearInitialGroupCode?: () => void;
  onActiveGroupChange?: (group: Group | null) => void;
  onGroupsChange?: (groups: Group[]) => void;
  lastUpdatedGroups?: Group[] | null;
  triggerCreateModal?: boolean;
  onResetTriggerCreateModal?: () => void;
  triggerJoinModal?: boolean;
  onResetTriggerJoinModal?: () => void;
}

export const GroupsSection: React.FC<GroupsSectionProps> = ({
  currentUser,
  onOpenAuth,
  activeGroup: propActiveGroup,
  initialGroupCode,
  onClearInitialGroupCode,
  onActiveGroupChange,
  onGroupsChange,
  lastUpdatedGroups,
  triggerCreateModal,
  onResetTriggerCreateModal,
  triggerJoinModal,
  onResetTriggerJoinModal,
}) => {
  const { language, t } = useLanguage();
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(propActiveGroup || null);
  const [justUpdatedMemberId, setJustUpdatedMemberId] = useState<string | null>(null);

  // Modals & Premium states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [inviteModalGroup, setInviteModalGroup] = useState<Group | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isVipUpgradeOpen, setIsVipUpgradeOpen] = useState(false);
  const [showVipAnalytics, setShowVipAnalytics] = useState(false);
  const [isDecreeModalOpen, setIsDecreeModalOpen] = useState(false);
  const [decreeInput, setDecreeInput] = useState('');
  const [isLimitReachedModalOpen, setIsLimitReachedModalOpen] = useState(false);

  // Form states
  const [groupName, setGroupName] = useState('');
  const [groupCategory, setGroupCategory] = useState<'friends' | 'work' | 'school' | 'family'>('friends');
  const [groupDescription, setGroupDescription] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeframe, setTimeframe] = useState<'all' | 'today' | 'week'>('all');

  // Supabase is the source of truth. Do not trust a cached localStorage user.
  const effectiveUser = currentUser;

  const currentUserRef = useRef<User | null>(effectiveUser);
  useEffect(() => {
    currentUserRef.current = effectiveUser;
  }, [effectiveUser]);
  const [pushStatus, setPushStatus] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    const refresh = () => {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        setPushStatus('unsupported');
        return;
      }
      const enabled = getNotificationSettings().webPushEnabled;
      if (!enabled) {
        setPushStatus('default');
        return;
      }
      setPushStatus(Notification.permission);
    };
    refresh();
    window.addEventListener('poop:notification-settings-updated', refresh);
    return () => window.removeEventListener('poop:notification-settings-updated', refresh);
  }, []);

  const handleToggleRoomPush = async () => {
    const granted = await requestWebPushPermission(effectiveUser?.id);
    if (granted) {
      setPushStatus('granted');
      showToast({
        type: 'success',
        title: t('Alertas de Sala Activas', 'Alertas de Sala Activas'),
        description: t(
          'Te avisaremos al instante si alguien anota o te quita el 1.º lugar en esta sala.',
          'Te avisaremos al instante si alguien anota o te quita el 1.º lugar en esta sala.'
        )
      });
    } else {
      showToast({
        type: 'info',
        title: t('Permiso necesario', 'Permiso necesario'),
        description: t(
          'Activa las notificaciones en tu navegador para recibir alertas de la sala.',
          'Activa las notificaciones en tu navegador para recibir alertas de la sala.'
        )
      });
    }
  };

  useEffect(() => {
    currentUserRef.current = effectiveUser;
  }, [effectiveUser]);

  // Sync with propActiveGroup from parent (e.g. when switched in Hero)
  useEffect(() => {
    if (propActiveGroup !== undefined) {
      setActiveGroup(propActiveGroup);
    }
  }, [propActiveGroup]);

  // Notify parent of activeGroup changes
  useEffect(() => {
    onActiveGroupChange?.(activeGroup);
  }, [activeGroup]);

  // Notify parent of userGroups changes so Hero can render room switcher immediately
  useEffect(() => {
    onGroupsChange?.(userGroups);
  }, [userGroups]);

  const handleSelectGroup = (grp: Group | null) => {
    if (!grp) return;
    setActiveGroup(grp);
    onActiveGroupChange?.(grp);
    localStorage.setItem('poop_active_group_id', grp.id);
  };

  // Handle external trigger for Create Room Modal
  useEffect(() => {
    if (triggerCreateModal) {
      if (!effectiveUser) {
        try {
          localStorage.setItem('poop_pending_action', 'create_group');
        } catch {}
        onOpenAuth('signup');
      } else {
        setIsCreateModalOpen(true);
      }
      onResetTriggerCreateModal?.();
    }
  }, [triggerCreateModal, effectiveUser]);

  // Handle external trigger for Join Room Modal
  useEffect(() => {
    if (triggerJoinModal) {
      if (!effectiveUser) {
        onOpenAuth('signup');
      } else {
        setIsJoinModalOpen(true);
      }
      onResetTriggerJoinModal?.();
    }
  }, [triggerJoinModal, effectiveUser]);

  // Sync when parent provides immediate post-poop updated groups (0ms instant response)
  useEffect(() => {
    if (lastUpdatedGroups && lastUpdatedGroups.length > 0) {
      setUserGroups(prev => {
        const merged = [...prev];
        lastUpdatedGroups.forEach(upG => {
          const idx = merged.findIndex(g => g.id === upG.id);
          if (idx >= 0) merged[idx] = upG;
          else merged.unshift(upG);
        });
        return merged;
      });

      if (activeGroup) {
        const fresh = lastUpdatedGroups.find(g => g.id === activeGroup.id);
        if (fresh) {
          setActiveGroup(fresh);
          if (currentUser?.id) {
            setJustUpdatedMemberId(currentUser.id);
            setTimeout(() => setJustUpdatedMemberId(null), 2500);
          }
        }
      }
    }
  }, [lastUpdatedGroups]);

  const fetchGroups = async (silent: boolean = false) => {
    const currentUid = currentUserRef.current?.id;
    if (!currentUid) {
      setUserGroups([]);
      setActiveGroup(null);
      return;
    }
    try {
      const mine = await getMyRooms();

      const uGroups: Group[] = (mine || [])
        .map((group) => hydrateGroup(group.id, group))
        .sort((a, b) => String((b as any).lastActivityAt || b.createdAt).localeCompare(String((a as any).lastActivityAt || a.createdAt)));

      setUserGroups(uGroups);

      if (uGroups.length > 0) {
        const savedGid = localStorage.getItem('poop_active_group_id');
        const found = savedGid ? uGroups.find(g => g.id === savedGid) : null;
        const target = found || uGroups[0];
        setActiveGroup(target);
        onActiveGroupChange?.(target);
        localStorage.setItem('poop_active_group_id', target.id);
      } else {
        setActiveGroup(null);
        onActiveGroupChange?.(null);
      }
    } catch (e) {
      if (!silent) console.warn('Error fetching groups:', e);
    }
  };

  // 1. Initial REST fetch on mount or user change
  useEffect(() => {
    if (!currentUser) {
      setUserGroups([]);
      setActiveGroup(null);
      return;
    }
    fetchGroups();
  }, [currentUser?.id]);

  // 2. REALTIME: RLS limits rooms and room_members to this user's rooms.
  useEffect(() => {
    const uid = currentUser?.id;
    if (!uid) {
      setUserGroups([]);
      setActiveGroup(null);
      return;
    }

    const supabase = getSupabase();
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const refresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        fetchGroups(true);
      }, 250);
    };

    const channel = supabase
      .channel(`rooms-${uid}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_members' },
        refresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        refresh
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('Rooms realtime channel unavailable; falling back to manual refresh.');
        }
      });

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  // Handle invite links (?group=CODE) from WhatsApp or shared links
  useEffect(() => {
    if (!initialGroupCode) return;
    const targetCode = initialGroupCode.trim().toUpperCase();

    const handleInviteLink = async () => {
      try {
        const preview = await getRoomByCode(targetCode);
        if (!preview) return;

        const isMember = Boolean(
          currentUser &&
          ((preview as any).isMember ||
            preview.members?.some((m: GroupMember) => m.userId === currentUser.id))
        );

        if (isMember) {
          const mine = await getMyRooms();
          const groupData = mine.find((group) => group.code === targetCode || group.id === preview.id);
          if (groupData) {
            setActiveGroup(groupData);
            showToast({
              type: 'success',
              title: groupData.name,
              description: t('Switched to this group', 'Mostrando tu grupo')
            });
          }
        } else {
          setInviteModalGroup(hydrateGroup(preview.id, preview));
          setJoinCodeInput(preview.code);
        }
      } catch (err) {
        console.warn('Error fetching invite group:', err);
      } finally {
        onClearInitialGroupCode?.();
      }
    };

    handleInviteLink();
  }, [initialGroupCode, currentUser?.id]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveUser) {
      onOpenAuth('signup');
      return;
    }
    if (!groupName.trim() || groupName.trim().length < 3) {
      showToast({
        type: 'error',
        title: t('Error', 'Error'),
        description: t('Name must be at least 3 characters', 'El nombre debe tener al menos 3 caracteres')
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const data = await createRoom({
        name: groupName.trim(),
        category: groupCategory,
        description: groupDescription.trim(),
        avatar: effectiveUser.avatar
      });

      if (data.group) {
        setIsCreateModalOpen(false);
        setGroupName('');
        setGroupDescription('');
        setUserGroups(prev => [data.group, ...prev]);
        setActiveGroup(data.group);
        localStorage.setItem('poop_active_group_id', data.group.id);
        showToast({
          type: 'success',
          title: t('Room Created!', '¡Sala Creada!'),
          description: t(`Share code ${data.group.code} with friends!`, `¡Comparte el código ${data.group.code} con tus amigos!`)
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: t('Error', 'Error'),
        description: err?.message || t('Could not create group', 'No se pudo crear el grupo')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinGroup = async (codeToJoin?: string) => {
    const targetCode = (codeToJoin || joinCodeInput).trim().toUpperCase();
    if (!effectiveUser) {
      if (targetCode) {
        localStorage.setItem('poop_pending_group_code', targetCode);
      }
      onOpenAuth('signup');
      return;
    }
    if (!targetCode) {
      showToast({
        type: 'error',
        title: t('Error', 'Error'),
        description: t('Please enter a valid code', 'Ingresa un código válido')
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const data = await joinRoom(targetCode);

      if (data.group) {
        setIsJoinModalOpen(false);
        setInviteModalGroup(null);
        setJoinCodeInput('');
        setUserGroups(prev => {
          const exists = prev.some(g => g.id === data.group.id);
          return exists ? prev.map(g => g.id === data.group.id ? data.group : g) : [data.group, ...prev];
        });
        setActiveGroup(data.group);
        localStorage.setItem('poop_active_group_id', data.group.id);
        showToast({
          type: 'success',
          title: t('Joined Group!', '¡Te uniste al grupo!'),
          description: t(`Welcome to ${data.group.name}`, `Bienvenido a ${data.group.name}`)
        });
      }
    } catch (err: any) {
      if (err?.code === 'ROOM_FULL' || err?.details?.code === 'ROOM_FULL') {
        setIsJoinModalOpen(false);
        setIsLimitReachedModalOpen(true);
      } else {
        showToast({
          type: 'error',
          title: t('Error', 'Error'),
          description: err?.message || t('Could not join group', 'No se pudo unir al grupo')
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDecree = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup || !effectiveUser) return;
    try {
      setIsSubmitting(true);
      const data = await setDecree(activeGroup.id, decreeInput.trim());
      const updated = { ...activeGroup, royalDecree: data.royalDecree };
      setActiveGroup(updated);
      setUserGroups(prev => prev.map(g => g.id === activeGroup.id ? updated : g));
      setIsDecreeModalOpen(false);
      showToast({
        type: 'success',
        title: t('Decree Updated!', '¡Decreto Actualizado!'),
        description: t('All room members will now see the official decree.', 'Todos los miembros de la sala verán el decreto oficial.')
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: t('Error', 'Error'),
        description: err?.message || t('Could not update decree', 'No se pudo actualizar el decreto')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoomUpgraded = (updatedGroup: Group) => {
    setActiveGroup(updatedGroup);
    setUserGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
    onActiveGroupChange?.(updatedGroup);
    onGroupsChange?.(userGroups.map(g => g.id === updatedGroup.id ? updatedGroup : g));
    radarAudio.playFanfare();
  };

  const handleLeaveGroup = async () => {
    if (!activeGroup || !effectiveUser) return;
    try {
      setIsSubmitting(true);
      await leaveRoom(activeGroup.id);
      setIsLeaveModalOpen(false);
      const remaining = userGroups.filter(g => g.id !== activeGroup.id);
      setUserGroups(remaining);
      setActiveGroup(remaining.length > 0 ? remaining[0] : null);
      if (remaining.length > 0) localStorage.setItem('poop_active_group_id', remaining[0].id);
      else localStorage.removeItem('poop_active_group_id');
      showToast({
        type: 'success',
        title: t('Left group', 'Saliste del grupo'),
        description: t(`You left ${activeGroup.name}`, `Has salido de ${activeGroup.name}`)
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: t('Error', 'Error'),
        description: err?.message || t('Connection error', 'Error de conexión')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!activeGroup || !effectiveUser) return;
    try {
      setIsSubmitting(true);
      await deleteRoom(activeGroup.id);
      setIsDeleteModalOpen(false);
      const remaining = userGroups.filter(g => g.id !== activeGroup.id);
      setUserGroups(remaining);
      setActiveGroup(remaining.length > 0 ? remaining[0] : null);
      showToast({
        type: 'success',
        title: t('Group Deleted', 'Grupo Eliminado'),
        description: t('The group was completely removed', 'El grupo fue eliminado exitosamente')
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: t('Error', 'Error'),
        description: err?.message || t('Could not delete group', 'No se pudo eliminar el grupo')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCleanInviteUrl = (code: string) => {
    let base = window.location.origin;
    if (base.includes('localhost') || base.includes('127.0.0.1')) {
      base = window.location.href.split('?')[0];
    } else {
      base = window.location.origin + window.location.pathname;
    }
    return `${base.replace(/\/$/, '')}?group=${encodeURIComponent(code)}`;
  };

  const handleCopyInvite = (code: string) => {
    const inviteUrl = getCleanInviteUrl(code);
    navigator.clipboard.writeText(inviteUrl);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    showToast({
      type: 'success',
      title: t('Link copied!', '¡Enlace copiado!'),
      description: t('Send it in WhatsApp or chat to invite friends', 'Pégalo en tu chat o grupo de WhatsApp para que se unan')
    });
  };

  const handleShareWhatsApp = (group: Group) => {
    const inviteUrl = getCleanInviteUrl(group.code);
    const text = language === 'es'
      ? `¡Únete a nuestra liga "${group.name}" en poop.lol para ver quién va más al baño!\n\nCódigo de grupo: ${group.code}\n\nEntra directamente aquí:\n${inviteUrl}`
      : `Join our "${group.name}" league on poop.lol to see who poops the most!\n\nGroup code: ${group.code}\n\nJoin directly here:\n${inviteUrl}`;
    
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    const a = document.createElement('a');
    a.href = whatsappUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Group members sorted by selected timeframe
  const sortedMembers = activeGroup
    ? activeGroup.members.map(withFreshTimeframes).sort((a, b) => {
        if (timeframe === 'today') return (b.poopsToday || 0) - (a.poopsToday || 0);
        if (timeframe === 'week') return (b.poopsThisWeek || 0) - (a.poopsThisWeek || 0);
        return (b.groupPoops || 0) - (a.groupPoops || 0);
      })
    : [];

  const isUserMemberOfActive = !!(effectiveUser && activeGroup?.members?.some(m => m.userId === effectiveUser.id));
  const isOwnerOfActive = !!(effectiveUser && activeGroup && activeGroup.createdBy === effectiveUser.id);

  return (
    <div 
      id="groups-section" 
      className="w-full bg-white dark:bg-[#18181b] rounded-3xl border border-neutral-200/90 dark:border-neutral-800 p-3 sm:p-5 shadow-xs select-none transition-all scroll-mt-20"
    >
      
      {/* 1. TOP HEADER: Group Title on Left + Timeframe filters on Right */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-neutral-100 dark:border-neutral-800 flex-wrap">
        <div className="min-w-0 flex items-center gap-2 flex-wrap">
          <h2 className="text-lg sm:text-xl font-black tracking-tight text-neutral-950 dark:text-white uppercase truncate">
            {activeGroup ? activeGroup.name : t('PRIVATE ROOMS (FRIENDS & WORK)', 'SALAS PRIVADAS (AMIGOS & TRABAJO)')}
          </h2>

          {/* Premium badge or free-plan badge */}
          {activeGroup && (
            isRoomPremium(activeGroup) ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-neutral-950 text-[10px] font-black uppercase tracking-wider shadow-xs border border-amber-300">
                <Crown className="w-3 h-3 fill-neutral-950 stroke-[1]" />
                <span>{t('PREMIUM ROOM', 'SALA PREMIUM')}</span>
                <span className="text-[9px] bg-neutral-950 text-amber-300 px-1 py-0.2 rounded-full font-extrabold lowercase">
                  {t('unlimited', 'ilimitada')}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsVipUpgradeOpen(true)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 hover:bg-amber-100/60 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 text-[10px] font-bold border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer"
                title={t('Plan Gratis (hasta 5 miembros) - Toca para ver Sala Premium', 'Free Plan (up to 5 members) - Tap to see Room Premium')}
              >
                <span>{t('Free Tier', 'Plan Gratis')}:</span>
                <span className={`font-black ${activeGroup.memberCount >= 5 ? 'text-rose-500' : 'text-neutral-900 dark:text-white'}`}>
                  {activeGroup.memberCount}/5
                </span>
              </button>
            )
          )}
        </div>

        {/* Timeframe Filters and Room Alert Toggle right in header when room exists */}
        {activeGroup && (
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            {/* Room Push Notification Toggle Button */}
            <button
              type="button"
              onClick={handleToggleRoomPush}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                pushStatus === 'granted'
                  ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700/60 text-amber-700 dark:text-amber-300 shadow-2xs'
                  : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
              }`}
              title={
                pushStatus === 'granted'
                  ? t('Alertas activas para esta sala', 'Alertas activas para esta sala')
                  : t('Activar alertas cuando un amigo anote o te quite el 1.º lugar', 'Activar alertas cuando un amigo anote o te quite el 1.º lugar')
              }
            >
              {pushStatus === 'granted' ? (
                <>
                  <BellRing className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                  <span className="hidden sm:inline">{t('Alertas ON', 'Alertas ON')}</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="hidden sm:inline">{t('Activar alertas', 'Activar alertas')}</span>
                </>
              )}
            </button>

            <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-full p-0.5 text-xs font-extrabold border border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => setTimeframe('all')}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                  timeframe === 'all'
                    ? 'bg-neutral-950 dark:bg-amber-400 text-white dark:text-neutral-950 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {t('All-Time', 'Total')}
              </button>
              <button
                onClick={() => setTimeframe('week')}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                  timeframe === 'week'
                    ? 'bg-neutral-950 dark:bg-amber-400 text-white dark:text-neutral-950 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {t('Week', 'Semana')}
              </button>
              <button
                onClick={() => setTimeframe('today')}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                  timeframe === 'today'
                    ? 'bg-neutral-950 dark:bg-amber-400 text-white dark:text-neutral-950 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {t('Today', 'Hoy')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. GROUPS SWITCHER PILLS (User Rooms + Join + Create Actions) */}
      {userGroups.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
          {/* User's Private Rooms */}
          {userGroups.map((grp) => {
            const isSelected = activeGroup?.id === grp.id;
            return (
              <button
                key={grp.id}
                onClick={() => handleSelectGroup(grp)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-neutral-950 dark:bg-amber-400 text-white dark:text-neutral-950 border-neutral-950 dark:border-amber-400 shadow-2xs'
                    : 'bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-amber-400'
                }`}
              >
                {isRoomPremium(grp) && <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />}
                <span>{grp.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 dark:bg-neutral-950/20' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'}`}>
                  {grp.memberCount}
                </span>
              </button>
            );
          })}

          {/* Quick Join Room Button */}
          <button
            onClick={() => {
              if (!effectiveUser) onOpenAuth('signup');
              else setIsJoinModalOpen(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 transition-all cursor-pointer shrink-0"
            title={t('Join room with code', 'Unirse con código')}
          >
            <span># {t('Unirse', 'Unirse')}</span>
          </button>

          {/* Quick Create Room Button */}
          <button
            onClick={() => {
              if (!effectiveUser) onOpenAuth('signup');
              else setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-800 hover:border-amber-400 transition-all cursor-pointer shrink-0"
            title={t('Create another room', 'Crear otra sala')}
          >
            <Plus className="w-3 h-3 stroke-[2.5]" />
            <span>{t('Nueva Sala', 'Nueva Sala')}</span>
          </button>
        </div>
      )}

      {/* 3. IF NO ACTIVE GROUP: Welcome card to create or join a room */}
      {!activeGroup && (
          <div className="text-center py-8 px-4 sm:px-6 my-2 bg-gradient-to-b from-amber-500/5 to-transparent dark:from-amber-500/10 dark:to-transparent rounded-3xl border border-neutral-200/80 dark:border-neutral-800">
            <div className="w-13 h-13 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-500 mx-auto flex items-center justify-center mb-3 shadow-2xs border border-amber-300/40 dark:border-amber-700/50">
              <Users className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-neutral-950 dark:text-white">
              {effectiveUser
                ? t('You are not in any Private Room yet', 'Aún no perteneces a ninguna Sala Privada')
                : t('Private Rooms for Friends & Coworkers', 'Salas Privadas para Amigos y Compañeros')}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-md mx-auto mt-1.5 mb-4 leading-relaxed">
              {effectiveUser
                ? t('Create a room for your office or friends. Free plan up to 5 members or Premium Pass for unlimited members!', 'Crea una sala para tu oficina o amigos. ¡Plan gratis hasta 5 miembros o Pase Premium para miembros ilimitados!')
                : t('Compete privately with your friends or coworkers. Free plan up to 5 members or Premium room for entire teams!', 'Compite en privado con tus amigos o compañeros. ¡Plan gratis hasta 5 miembros o Sala Premium para equipos enteros!')}
            </p>

            {/* Freemium vs Premium Highlight Pills */}
            <div className="flex items-center justify-center gap-2 max-w-sm mx-auto mb-5 text-[11px] font-bold">
              <span className="px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                {t('Free: up to 5 members', 'Gratis: hasta 5')}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-400/30">
                {t('Premium: Unlimited + Pro Stats', 'Premium: Ilimitada + Pro')}
              </span>
            </div>

            <div className="flex items-center justify-center gap-2.5 flex-wrap">
              <button
                onClick={() => {
                  if (!effectiveUser) onOpenAuth('signup');
                  else setIsCreateModalOpen(true);
                }}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-neutral-950 font-black text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{t('+ Create Private Room', '+ Crear Sala Privada')}</span>
              </button>
              <button
                onClick={() => {
                  if (!effectiveUser) onOpenAuth('signup');
                  else setIsJoinModalOpen(true);
                }}
                className="px-4 py-2.5 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 active:scale-95 text-neutral-800 dark:text-white font-black text-xs sm:text-sm rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>{t('# Join with Code', '# Unirse con Código')}</span>
              </button>
            </div>
            {!effectiveUser && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-4">
                {t('Already have an account?', '¿Ya tienes una cuenta?')}{' '}
                <button
                  onClick={() => onOpenAuth('login')}
                  className="text-amber-600 dark:text-amber-400 font-extrabold hover:underline cursor-pointer"
                >
                  {t('Log in here', 'Inicia sesión aquí')}
                </button>
              </p>
            )}
          </div>
        )
      }

      {/* 5. FULL-FEATURED GRAND LEADERBOARD TABLE (Matches Global Ranking style) */}
      {activeGroup && (
        <div className="divide-y divide-neutral-100/60 dark:divide-neutral-800/60">
          {sortedMembers.length === 0 ? (
            <div className="py-10 text-center text-neutral-400 dark:text-neutral-500 font-bold text-xs flex flex-col items-center justify-center gap-2">
              <Crown className="w-8 h-8 text-amber-500 fill-amber-400" />
              <p className="text-neutral-900 dark:text-neutral-100 font-extrabold text-sm">
                {t('The Group Throne is Empty!', '¡El Trono del Grupo está Vacío!')}
              </p>
              <p className="text-xs text-neutral-500">
                {t('Be the first to log a drop in this league!', '¡Sé el primero en registrar una ida al baño en esta liga!')}
              </p>
            </div>
          ) : (
            sortedMembers.map((member, index) => {
              const hasAnyDrop = (member.groupPoops || 0) > 0 || (member.poopsToday || 0) > 0 || (member.poopsThisWeek || 0) > 0;
              const isKing = index === 0 && hasAnyDrop;
              const isCurrent = currentUser ? member.userId === currentUser.id : false;
              const isJustUpdated = justUpdatedMemberId === member.userId;
              const displayPoops = timeframe === 'today'
                ? (member.poopsToday || 0)
                : timeframe === 'week'
                  ? (member.poopsThisWeek || 0)
                  : (member.groupPoops || 0);

              return (
                <div
                  key={member.userId}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all my-2 flex items-start gap-3 select-none ${
                    isJustUpdated
                      ? 'bg-amber-200/90 dark:bg-amber-900/60 border-amber-500 ring-2 ring-amber-400 animate-pulse text-neutral-950 dark:text-white shadow-md'
                      : isKing
                      ? 'bg-amber-50 dark:bg-[#1a1816] border-amber-400 dark:border-amber-500/80 shadow-md shadow-amber-500/10 text-neutral-900 dark:text-white'
                      : isCurrent
                      ? 'bg-amber-100/70 dark:bg-[#1f1d18] border-amber-400 dark:border-amber-500/70 text-neutral-900 dark:text-white shadow-xs'
                      : 'bg-white dark:bg-[#18181b] border-neutral-200/90 dark:border-neutral-800 text-neutral-900 dark:text-white hover:border-amber-300 dark:hover:border-neutral-700 shadow-2xs'
                  }`}
                >
                  {/* Left: Avatar with rank badge */}
                  <div className="relative shrink-0 pt-0.5">
                    <img 
                      src={getUserPhoto(member.username, member.avatar)} 
                      alt={member.username} 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getDiceBearAvatar(member.username, 'toon-head');
                      }}
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border-2 border-amber-400/80 bg-neutral-800 object-cover p-0.5 shadow-sm" 
                    />
                    {isKing && (
                      <div className="absolute -top-1.5 -left-1.5 bg-amber-400 text-neutral-950 p-1 rounded-full shadow-xs">
                        <Crown className="w-3 h-3 fill-neutral-950 text-neutral-950" />
                      </div>
                    )}
                  </div>

                  {/* Right: Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    {/* Row 1: #Rank + Username + Flag + Role badge + Score */}
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className={`font-black text-sm sm:text-base shrink-0 ${isKing ? 'text-amber-500' : 'text-neutral-500'}`}>
                          #{index + 1}
                        </span>
                        <span className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white truncate min-w-0">
                          {member.username}
                        </span>
                        <div className="shrink-0 flex items-center justify-center">
                          <CountryFlag countryCode={member.countryCode} className="w-4 sm:w-4.5" />
                        </div>
                        {member.role === 'owner' && (
                          <span className="text-[9px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.2 rounded-md shrink-0">
                            Admin
                          </span>
                        )}
                        {isCurrent && (
                          <span className="bg-amber-400 text-neutral-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider shrink-0 shadow-2xs">
                            {t('YOU', 'TÚ')}
                          </span>
                        )}
                      </div>

                      {/* Right Score in Highlighted Orange */}
                      <div className="shrink-0 text-right font-black text-amber-600 dark:text-amber-400 text-sm sm:text-base tabular-nums flex items-center gap-1">
                        <span>{displayPoops.toLocaleString()}</span>
                        <span className="text-[11px] text-neutral-400 font-bold hidden sm:inline">{t('poops', 'popós')}</span>
                      </div>
                    </div>

                    {/* Row 2: Subtitle */}
                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 font-medium line-clamp-1 mt-0.5 leading-snug">
                      {isKing
                        ? t('King of this League', 'Rey de esta Liga')
                        : member.lastPoopAt
                          ? `${t('Last drop', 'Último registro')}: ${new Date(member.lastPoopAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : t('League Contender', 'Competidor en la Liga')}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 6. ROOM ACTIONS & INVITE PANEL */}
      {activeGroup && (
        <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
          {/* Compact Premium Bar OR Alert when Free Limit Reached */}
          {isRoomPremium(activeGroup) ? (
            <div className="space-y-1.5">
              <div className="px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-between gap-2 text-xs flex-wrap">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                  <span className="font-black text-xs text-neutral-900 dark:text-white">
                    {t('Sala Premium', 'Premium Room')}
                    <span className="font-normal text-neutral-500 dark:text-neutral-400 text-[11px] ml-1">
                      ({t('patrocinada por', 'sponsored by')} {activeGroup.vipSponsoredBy || activeGroup.createdByName || 'Anfitrión'})
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setDecreeInput(activeGroup.royalDecree || '');
                      setIsDecreeModalOpen(true);
                    }}
                    className="px-2 py-1 rounded-xl text-[11px] font-black bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-amber-300/60 dark:border-amber-700/60 hover:border-amber-400 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Scroll className="w-3 h-3 text-amber-500" />
                    <span>{t('Decreto', 'Decree')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowVipAnalytics(prev => !prev)}
                    className="px-2 py-1 rounded-xl text-[11px] font-black bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-amber-300/60 dark:border-amber-700/60 hover:border-amber-400 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <BarChart3 className="w-3 h-3 text-amber-500" />
                    <span>{t('Stats', 'Stats')}</span>
                  </button>
                </div>
              </div>

              {/* Royal Decree Callout if set and stats closed */}
              {activeGroup.royalDecree && !showVipAnalytics && (
                <div className="px-3 py-1 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center gap-2 text-[11px]">
                  <Scroll className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                  <p className="font-semibold text-neutral-800 dark:text-neutral-200 italic line-clamp-2 flex-1">
                    "{activeGroup.royalDecree}"
                  </p>
                </div>
              )}

              {/* Premium Stats Grid (if toggled) */}
              {showVipAnalytics && (
                <div className="p-2.5 rounded-2xl bg-amber-500/5 border border-amber-400/20 grid grid-cols-2 sm:grid-cols-4 gap-2 animate-in fade-in-50 duration-150">
                  <div className="p-2 bg-white/70 dark:bg-neutral-900/70 rounded-xl border border-amber-400/20">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                      {t('Peak Hours', 'Hora Pico')}
                    </span>
                    <span className="font-black text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      10:00 - 11:30 AM
                    </span>
                  </div>
                  <div className="p-2 bg-white/70 dark:bg-neutral-900/70 rounded-xl border border-amber-400/20">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                      {t('Room Total', 'Total Sala')}
                    </span>
                    <span className="font-black text-xs text-neutral-900 dark:text-white mt-0.5 block">
                      {activeGroup.totalPoops.toLocaleString()} {t('drops', 'popós')}
                    </span>
                  </div>
                  <div className="p-2 bg-white/70 dark:bg-neutral-900/70 rounded-xl border border-amber-400/20">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                      {t('Average/User', 'Promedio')}
                    </span>
                    <span className="font-black text-xs text-neutral-900 dark:text-white mt-0.5 block">
                      {activeGroup.memberCount > 0 ? (activeGroup.totalPoops / activeGroup.memberCount).toFixed(1) : 0} {t('avg', 'prom.')}
                    </span>
                  </div>
                  <div className="p-2 bg-white/70 dark:bg-neutral-900/70 rounded-xl border border-amber-400/20">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                      {t('Room MVP', 'MVP Actual')}
                    </span>
                    <span className="font-black text-xs text-amber-600 dark:text-amber-400 truncate mt-0.5 flex items-center gap-1">
                      <Crown className="w-3 h-3 fill-amber-400" />
                      {sortedMembers[0]?.username || 'Nadie aún'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : activeGroup.memberCount >= 5 ? (
            /* Alert when Free Room reaches 5 members - NEVER TRUNCATED, FULLY VISIBLE */
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300 font-bold text-[11px] sm:text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                <span className="leading-tight">
                  {activeGroup.memberCount > 5
                    ? t(
                        `Premium expired (${activeGroup.memberCount} members kept). New members are blocked until the room is back to 5 or Premium is renewed.`,
                        `Premium expiró (${activeGroup.memberCount} miembros conservados). No se permiten nuevos miembros hasta volver a 5 o renovar Premium.`
                      )
                    : t(
                        'Room limit reached (5/5 members).',
                        'Límite de sala alcanzado (5/5 miembros).'
                      )}
                </span>
              </div>
              {isOwnerOfActive && (
                <button
                  type="button"
                  onClick={() => setIsVipUpgradeOpen(true)}
                  className="w-full sm:w-auto px-2.5 py-1 bg-amber-400 hover:bg-amber-300 active:scale-95 text-neutral-950 font-black text-[11px] sm:text-xs rounded-xl shadow-2xs transition-all cursor-pointer text-center whitespace-nowrap"
                >
                  {t('Activate Premium ($2.99/mo)', 'Activar Premium ($2.99/mes)')}
                </button>
              )}
            </div>
          ) : (
            /* Discreet 1-liner when Free Room has space (< 5) */
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 px-1 gap-1 sm:gap-2">
              <span className="flex items-center gap-1 font-semibold">
                <Users className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>{t('Plan Gratis', 'Plan Gratis')}: {activeGroup.memberCount}/5 {t('miembros', 'miembros')}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsVipUpgradeOpen(true)}
                className="text-amber-600 dark:text-amber-400 font-extrabold hover:underline cursor-pointer flex items-center gap-1 w-fit"
              >
                <Crown className="w-3 h-3 fill-amber-500 shrink-0" />
                <span>{t('Activar Premium ($2.99/mes)', 'Activar Premium ($2.99/mes)')}</span>
              </button>
            </div>
          )}

          {/* Row 1: Code + Direct WhatsApp Invite */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Left: Code with Copy */}
            <div className="flex items-center justify-between px-3 py-2 bg-neutral-100 dark:bg-neutral-800/90 rounded-2xl border border-neutral-200/80 dark:border-neutral-700 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 shrink-0">
                  {t('CODE', 'CÓDIGO')}:
                </span>
                <span className="font-mono text-xs sm:text-sm font-black text-neutral-950 dark:text-white tracking-wider truncate">
                  {activeGroup.code}
                </span>
              </div>
              <button
                onClick={() => handleCopyInvite(activeGroup.code)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-black text-neutral-800 dark:text-neutral-200 hover:text-amber-500 bg-white dark:bg-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-600 rounded-xl shadow-2xs transition-colors cursor-pointer shrink-0 border border-neutral-200/60 dark:border-neutral-600 active:scale-95"
                title={t('Copy Invite Link', 'Copiar enlace')}
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{copiedCode ? t('Copied!', '¡Copiado!') : t('Copy', 'Copiar')}</span>
              </button>
            </div>

            {/* Right: Direct WhatsApp Invite */}
            <button
              onClick={() => handleShareWhatsApp(activeGroup)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.98] text-white font-black text-xs sm:text-sm rounded-2xl shadow-xs transition-all cursor-pointer min-w-0"
              title={t('Invite friends via WhatsApp', 'Invitar amigos por WhatsApp')}
            >
              <WhatsAppIcon className="w-4 h-4 fill-white shrink-0" />
              <span className="truncate">{t('Invite on WhatsApp', 'Invitar a WhatsApp')}</span>
            </button>
          </div>

          {/* Row 2: Room Management Actions - STRICT 3-BUTTON ROW: CREATE ROOM, JOIN CODE, LEAVE ROOM */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full pt-1">
            {/* 1. Create Room */}
            <button
              onClick={() => {
                if (!effectiveUser) onOpenAuth('signup');
                else setIsCreateModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-2 text-[11px] sm:text-xs font-black text-neutral-950 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-xl shadow-2xs transition-all cursor-pointer border border-amber-300 min-w-0"
              title={t('Create Room', 'Crear Sala')}
            >
              <Plus className="w-3.5 h-3.5 stroke-[3] shrink-0" />
              <span className="truncate">{t('Create Room', 'Crear Sala')}</span>
            </button>

            {/* 2. Join Code */}
            <button
              onClick={() => {
                if (!effectiveUser) onOpenAuth('signup');
                else setIsJoinModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-2 text-[11px] sm:text-xs font-black text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-all cursor-pointer border border-neutral-200 dark:border-neutral-700 active:scale-95 min-w-0"
              title={t('Join Code', 'Unirse')}
            >
              <LogIn className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">{t('Join Code', 'Unirse')}</span>
            </button>

            {/* 3. Leave Room (or Delete Room if creator) */}
            {isOwnerOfActive ? (
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="w-full flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-2 text-[11px] sm:text-xs font-black text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 bg-white dark:bg-[#18181b] rounded-xl border border-rose-200 dark:border-rose-900/60 transition-all cursor-pointer active:scale-95 min-w-0"
                title={t('Delete Room (Admin)', 'Eliminar Sala (Admin)')}
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t('Delete Room', 'Eliminar')}</span>
              </button>
            ) : isUserMemberOfActive ? (
              <button
                onClick={() => setIsLeaveModalOpen(true)}
                className="w-full flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-2 text-[11px] sm:text-xs font-black text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 bg-white dark:bg-[#18181b] rounded-xl border border-neutral-200 dark:border-neutral-700 transition-all cursor-pointer active:scale-95 min-w-0"
                title={t('Leave Room', 'Salir de la Sala')}
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="truncate">{t('Leave Room', 'Salir')}</span>
              </button>
            ) : (
              <button
                onClick={() => handleJoinGroup(activeGroup.code)}
                className="w-full flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-2 text-[11px] sm:text-xs font-black text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 transition-all cursor-pointer active:scale-95 min-w-0"
                title={t('Join this Room', 'Unirme a esta Sala')}
              >
                <LogIn className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">{t('Join Room', 'Unirme')}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* CREATE GROUP MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs" onClick={() => setIsCreateModalOpen(false)} />
          <div className="relative bg-white dark:bg-[#18181b] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 z-10 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-lg font-black text-neutral-950 dark:text-white">
                {t('Create a Private Room', 'Crear Sala Privada')}
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-3">
                <p className="text-xs font-black text-emerald-800 dark:text-emerald-300">
                  {t('Free room', 'Sala gratis')} · {t('up to 5 members including you', 'hasta 5 miembros incluyéndote')}
                </p>
                <p className="text-[11px] font-semibold text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                  {t(
                    'You can activate Premium later from the room panel for $2.99/mo.',
                    'Puedes activar Premium luego desde el panel de la sala por $2.99/mes.'
                  )}
                </p>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-300 block mb-1.5">
                  {t('Room Name', 'Nombre de la Sala')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('e.g. 5to Año Colegio, Dev Team Piso 3, Los Primos', 'ej. 5to Año Colegio, Dev Team Piso 3, Los Primos')}
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-300 block mb-1.5">
                  {t('Motto / Description (Optional)', 'Lema o Descripción (Opcional)')}
                </label>
                <input
                  type="text"
                  placeholder={t('e.g. A ver quién va más al baño', 'ej. A ver quién va más al baño')}
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-amber-400 hover:bg-amber-300 active:scale-95 text-neutral-950 font-black text-sm rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting
                  ? t('Creating...', 'Creando...')
                  : t('Create Free Room', 'Crear Sala Gratis')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* JOIN GROUP MODAL */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs" onClick={() => setIsJoinModalOpen(false)} />
          <div className="relative bg-white dark:bg-[#18181b] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 z-10 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-lg font-black text-neutral-950 dark:text-white">
                {t('Join a Private Room with Code', 'Unirse a una Sala Privada')}
              </h3>
              <button onClick={() => setIsJoinModalOpen(false)} className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-300 block mb-1.5">
                  {t('Enter Room Invite Code', 'Ingresa el Código de Invitación')}
                </label>
                <input
                  type="text"
                  placeholder="ej. COLE-2024 o DEV-TEAM"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono text-base font-black tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <button
                type="button"
                onClick={() => handleJoinGroup()}
                disabled={isSubmitting || !joinCodeInput.trim()}
                className="w-full py-3 bg-amber-400 hover:bg-amber-300 active:scale-95 text-neutral-950 font-black text-sm rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? t('Joining...', 'Uniéndose...') : t('Join Room Now', 'Unirse a la Sala Ahora')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVITE PROMPT MODAL (From WhatsApp link) */}
      {inviteModalGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-xs" onClick={() => setInviteModalGroup(null)} />
          <div className="relative bg-white dark:bg-[#18181b] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 z-10 animate-in zoom-in-95 duration-150">
            <div className="text-center space-y-3">
              <h3 className="text-xl font-black text-neutral-950 dark:text-white">
                {t('You were invited to join:', '¡Te invitaron a unirte a:')}
              </h3>
              <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                <h4 className="text-base font-black text-amber-600 dark:text-amber-400">
                  {inviteModalGroup.name}
                </h4>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {inviteModalGroup.memberCount} {t('members competing', 'miembros')}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-200/60 dark:bg-neutral-800 rounded-xl text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300">
                  <span>{t('Code', 'Código')}: {inviteModalGroup.code}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => handleJoinGroup(inviteModalGroup.code)}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-sm rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {isSubmitting ? t('Joining...', 'Uniéndose...') : t('Join Group Now!', '¡Unirme al Grupo Ahora!')}
                </button>
                <button
                  onClick={() => setInviteModalGroup(null)}
                  className="w-full py-2.5 text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {t('Cancel', 'Cancelar')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LEAVE GROUP MODAL */}
      {isLeaveModalOpen && activeGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs" onClick={() => setIsLeaveModalOpen(false)} />
          <div className="relative bg-white dark:bg-[#18181b] rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 z-10 animate-in zoom-in-95 duration-150">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center shrink-0">
                <LogOut className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-neutral-950 dark:text-white">
                {t('Leave Group?', '¿Salir del Grupo?')}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t(
                  `Are you sure you want to leave "${activeGroup.name}"? You will need the code to re-join.`,
                  `¿Estás seguro de que deseas salir de "${activeGroup.name}"? Necesitarás el código para volver a entrar.`
                )}
              </p>

              <div className="grid grid-cols-2 gap-2 w-full pt-2">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="py-2.5 px-3 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  {t('Cancel', 'Cancelar')}
                </button>
                <button
                  type="button"
                  onClick={handleLeaveGroup}
                  disabled={isSubmitting}
                  className="py-2.5 px-3 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-black shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? t('Leaving...', 'Saliendo...') : t('Yes, Leave', 'Sí, Salir')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE GROUP MODAL (Creator/Admin Only) */}
      {isDeleteModalOpen && activeGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="relative bg-white dark:bg-[#18181b] rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 z-10 animate-in zoom-in-95 duration-150">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-neutral-950 dark:text-white">
                {t('Delete Group?', '¿Eliminar Grupo?')}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t(
                  `As the creator of "${activeGroup.name}", this will permanently delete the group for all members. This cannot be undone.`,
                  `Como creador de "${activeGroup.name}", esta acción eliminará el grupo permanentemente para todos los miembros. No se puede deshacer.`
                )}
              </p>

              <div className="grid grid-cols-2 gap-2 w-full pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="py-2.5 px-3 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  {t('Cancel', 'Cancelar')}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteGroup}
                  disabled={isSubmitting}
                  className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? t('Deleting...', 'Eliminando...') : t('Delete Group', 'Eliminar Grupo')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium UPGRADE MODAL */}
      <RoomPremiumModal
        isOpen={isVipUpgradeOpen}
        onClose={() => setIsVipUpgradeOpen(false)}
        group={activeGroup}
        currentUser={effectiveUser}
        onUpgraded={handleRoomUpgraded}
      />

      {/* ROYAL DECREE MODAL */}
      {isDecreeModalOpen && activeGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs" onClick={() => setIsDecreeModalOpen(false)} />
          <div className="relative bg-white dark:bg-[#18181b] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-400/40 dark:border-amber-500/30 z-10 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Scroll className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-black text-neutral-950 dark:text-white">
                  {t('Room Royal Decree', 'Decreto Real de la Sala')}
                </h3>
              </div>
              <button onClick={() => setIsDecreeModalOpen(false)} className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isOwnerOfActive ? (
              <form onSubmit={handleSaveDecree} className="space-y-4">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t(
                    'As the room host, you can establish official room rules, bets, or funny group mottos for all members to see.',
                    'Como anfitrión, puedes fijar reglas oficiales de la sala, apuestas o lemas divertidos para todos los miembros.'
                  )}
                </p>
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-300 block mb-1.5">
                    {t('Official Decree Text', 'Texto del Decreto Oficial')}
                  </label>
                  <textarea
                    rows={3}
                    maxLength={140}
                    required
                    placeholder={t(
                      'e.g. Quien pierda la semana invita los tacos al equipo',
                      'ej. Quien pierda la semana invita los tacos al equipo'
                    )}
                    value={decreeInput}
                    onChange={(e) => setDecreeInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium resize-none"
                  />
                  <span className="text-[10px] text-neutral-400 float-right">
                    {decreeInput.length}/140
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDecreeModalOpen(false)}
                    className="py-2.5 px-3 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    {t('Cancel', 'Cancelar')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !decreeInput.trim()}
                    className="py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-black shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? t('Saving...', 'Guardando...') : t('Publish Decree', 'Publicar Decreto')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-center py-2">
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/50 text-neutral-900 dark:text-white font-semibold italic text-sm">
                  "{activeGroup.royalDecree || t('No decree set by the host yet.', 'El anfitrión aún no ha redactado un decreto.')}"
                </div>
                <p className="text-xs text-neutral-400">
                  {t('Only the room creator can edit this decree.', 'Solo el creador de la sala puede editar este decreto.')}
                </p>
                <button
                  type="button"
                  onClick={() => setIsDecreeModalOpen(false)}
                  className="w-full py-2.5 px-3 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-black cursor-pointer"
                >
                  {t('Close', 'Cerrar')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LIMIT REACHED MODAL (When attempting to join a full 5/5 free room) */}
      {isLimitReachedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs" onClick={() => setIsLimitReachedModalOpen(false)} />
          <div className="relative bg-white dark:bg-[#18181b] rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 z-10 animate-in zoom-in-95 duration-150">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-13 h-13 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0 border border-amber-300">
                <Crown className="w-7 h-7 fill-amber-400 text-amber-500" />
              </div>

              <h3 className="text-lg font-black text-neutral-950 dark:text-white">
                {t('This room is full', 'Esta sala está llena')}
              </h3>

              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {t(
                  'This free room already has 5 members. Ask the room host to activate Room Premium ($2.99/mo) if they need unlimited members.',
                  'Esta sala gratuita ya tiene 5 miembros. Pídele al anfitrión que active Sala Premium ($2.99/mes) si necesita miembros ilimitados.'
                )}
              </p>

              <div className="w-full pt-2">
                <button
                  type="button"
                  onClick={() => setIsLimitReachedModalOpen(false)}
                  className="w-full py-2.5 bg-neutral-950 dark:bg-[#facc15] text-white dark:text-neutral-950 text-xs font-black rounded-xl cursor-pointer"
                >
                  {t('Got it', 'Entendido')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
