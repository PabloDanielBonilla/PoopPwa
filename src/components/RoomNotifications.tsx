'use client';

import { useEffect } from 'react';
import { getSupabase } from '../lib/supabase/client';
import { showToast } from '../utils/notificationService';

interface RoomNotificationsProps {
  userId: string | null;
}

/**
 * In-app notifications for room activity. The notifications table has an RLS
 * policy that only lets a user read rows where user_id = auth.uid(), and the
 * server only inserts rows for other members of the same room.
 */
export function RoomNotifications({ userId }: RoomNotificationsProps) {
  useEffect(() => {
    if (!userId) return;

    const supabase = getSupabase();
    const seen = new Set<string>();
    let initialized = false;

    const channel = supabase
      .channel(`room-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = payload.new as any;
          if (!notification?.id || seen.has(notification.id)) return;
          seen.add(notification.id);
          if (!initialized) return;

          showToast({
            type: 'radar_drop',
            title: notification.title || 'Movimiento en tu sala',
            description: notification.body || 'Alguien acaba de registrar un popó.',
            avatar: notification.actor_avatar,
            badge: notification.data?.groupName || notification.data?.groupCode,
            actionLabel: 'Ver sala',
            duration: 7000,
            meta: { groupId: notification.room_id },
          });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('Room notifications realtime channel unavailable.');
        }
      });

    (async () => {
      const { data } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      for (const row of data ?? []) seen.add(row.id);
      initialized = true;
    })();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return null;
}
