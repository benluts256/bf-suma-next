// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — useRealtime Hooks
// hooks/use-realtime.ts
// Real-time subscriptions for messages, locations, and activity
// ═══════════════════════════════════════════════════════════════════════════════

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Message, DistributorLocation, Notification } from '@/types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * Subscribe to real-time messages for a profile.
 */
export function useRealtimeMessages(profileId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    if (!profileId) return;

    const channel = supabase
      .channel(`messages:${profileId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${profileId}`,
        },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          if (payload.new && 'id' in payload.new) {
            setMessages((prev) => [...prev, payload.new as Message]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, supabase]);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, clearMessages };
}

/**
 * Subscribe to real-time distributor location updates.
 */
export function useRealtimeLocations() {
  const [locations, setLocations] = useState<Map<string, DistributorLocation>>(new Map());
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    const channel = supabase
      .channel('distributor-locations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'distributor_locations',
        },
        (payload: RealtimePostgresChangesPayload<DistributorLocation>) => {
          if (payload.new && 'id' in payload.new) {
            const loc = payload.new as DistributorLocation;
            setLocations((prev) => {
              const next = new Map(prev);
              next.set(loc.distributor_id, loc);
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return { locations: Array.from(locations.values()) };
}

/**
 * Subscribe to real-time notifications for a user.
 */
export function useRealtimeNotifications(profileId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    if (!profileId) return;

    // Load initial unread count
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profileId)
      .eq('is_read', false)
      .then((result: { count: number | null }) => setUnreadCount(result.count ?? 0));

    const channel = supabase
      .channel(`notifications:${profileId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profileId}`,
        },
        (payload: RealtimePostgresChangesPayload<Notification>) => {
          if (payload.new && 'id' in payload.new) {
            setNotifications((prev) => [payload.new as Notification, ...prev]);
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, supabase]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      setUnreadCount((prev) => Math.max(0, prev - 1));
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    if (!profileId) return;
    await fetch('/api/notifications/mark-all-read', { method: 'POST' });
    setUnreadCount(0);
  }, [profileId]);

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}
