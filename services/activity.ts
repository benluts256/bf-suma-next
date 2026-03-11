// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — Activity Log Service
// services/activity.ts
// ═══════════════════════════════════════════════════════════════════════════════

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ActivityLog, ActivityType } from '@/types';

export async function logActivity(
  supabase: SupabaseClient,
  params: {
    userId?: string;
    activity: ActivityType;
    description?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  await supabase.from('activity_logs').insert({
    user_id: params.userId ?? null,
    activity: params.activity,
    description: params.description ?? null,
    metadata: params.metadata ?? {},
  });
}

export async function getActivityLogs(
  supabase: SupabaseClient,
  options?: {
    userId?: string;
    activity?: ActivityType;
    limit?: number;
    offset?: number;
  }
): Promise<ActivityLog[]> {
  let query = supabase
    .from('activity_logs')
    .select('*, user:profiles!user_id(id, full_name, avatar_url, role)')
    .order('created_at', { ascending: false })
    .limit(options?.limit ?? 50);

  if (options?.userId) {
    query = query.eq('user_id', options.userId);
  }

  if (options?.activity) {
    query = query.eq('activity', options.activity);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit ?? 50) - 1);
  }

  const { data, error } = await query;
  if (error) return [];
  return data as ActivityLog[];
}

export async function getRecentActivity(
  supabase: SupabaseClient,
  limit = 10
): Promise<ActivityLog[]> {
  return getActivityLogs(supabase, { limit });
}
