// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — Profile Service
// services/profiles.ts
// ═══════════════════════════════════════════════════════════════════════════════

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Profile } from '@/types';

export async function getProfile(
  supabase: SupabaseClient,
  authUserId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();

  if (error || !data) return null;
  return data as Profile;
}

export async function updateProfile(
  supabase: SupabaseClient,
  profileId: string,
  updates: Partial<Pick<Profile, 'full_name' | 'phone' | 'avatar_url' | 'metadata'>>
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', profileId)
    .select()
    .single();

  if (error || !data) return null;
  return data as Profile;
}

export async function getAllProfiles(
  supabase: SupabaseClient,
  options?: { role?: string; page?: number; pageSize?: number }
) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (options?.role) {
    query = query.eq('role', options.role);
  }

  const { data, error, count } = await query;

  return {
    data: (data ?? []) as Profile[],
    total: count ?? 0,
    error: error?.message ?? null,
  };
}
