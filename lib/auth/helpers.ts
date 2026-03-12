// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — Auth Helper Functions
// lib/auth/helpers.ts
// Server-side auth utilities for getting user and profile data
// ═══════════════════════════════════════════════════════════════════════════════

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppRole, Profile } from '@/types';

/**
 * Get the authenticated user from Supabase auth.
 * Returns null if not authenticated.
 */
export async function getAuthUser(supabase: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

/**
 * Get the user's profile from the profiles table.
 * Returns null if no profile found.
 */
export async function getUserProfile(
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

/**
 * Get the user's role from their profile.
 * Returns null if no profile found.
 */
export async function getUserRole(
  supabase: SupabaseClient,
  authUserId: string
): Promise<AppRole | null> {
  const profile = await getUserProfile(supabase, authUserId);
  return profile?.role ?? null;
}

/**
 * Require authentication — redirects to /auth if not authenticated.
 * Returns the user and profile for use in server components.
 */
export async function requireAuth(supabase: SupabaseClient) {
  const user = await getAuthUser(supabase);
  if (!user) return null;

  const profile = await getUserProfile(supabase, user.id);
  if (!profile) return null;

  return { user, profile };
}

/**
 * Require a specific role — returns null if user doesn't have the role.
 * Also includes role-specific data (distributor/client) if applicable.
 */
export async function requireRole(
  supabase: SupabaseClient,
  requiredRole: AppRole
) {
  const auth = await requireAuth(supabase);
  if (!auth) return null;
  if (auth.profile.role !== requiredRole) return null;

  // Fetch role-specific data
  let distributor = null;
  let client = null;

  if (requiredRole === 'distributor') {
    const { data } = await supabase
      .from('distributors')
      .select('*')
      .eq('profile_id', auth.profile.id)
      .single();
    distributor = data;
  } else if (requiredRole === 'client') {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('profile_id', auth.profile.id)
      .single();
    client = data;
  }

  return { user: auth.user, profile: auth.profile, distributor, client };
}

/**
 * Validate that a redirect path is safe (relative, not protocol-relative).
 */
export function safeRedirectPath(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('/') && !path.startsWith('//')) return path;
  return null;
}
