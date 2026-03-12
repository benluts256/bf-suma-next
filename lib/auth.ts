// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — Centralized Auth Utilities
// File: lib/auth.ts
// Single source of truth for role routes, auth helpers, and type definitions.
// ═══════════════════════════════════════════════════════════════════════════════

import type { SupabaseClient } from "@supabase/supabase-js";

// ── Role types ────────────────────────────────────────────────────────────────

export type AppRole = "manager" | "distributor" | "client";

// ── Role → dashboard route mapping (single source of truth) ──────────────────

export const ROLE_ROUTES: Record<string, string> = {
  admin:       "/admin/dashboard",
  manager:     "/admin/dashboard",
  distributor: "/distributor/dashboard",
  client:      "/client/analytics",
};

// ── Auth helpers ──────────────────────────────────────────────────────────────

/**
 * Wraps `supabase.auth.getUser()` with proper error handling.
 * Returns the authenticated user or `null` if not authenticated.
 */
export async function getAuthUser(supabase: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("[auth] getAuthUser error:", error.message);
    return null;
  }

  return user;
}

/**
 * Queries the `profiles` table for the given user's role.
 * Returns the role string or `null` if no profile is found.
 */
export async function getUserRole(
  supabase: SupabaseClient,
  userId: string
): Promise<AppRole | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("auth_user_id", userId)
    .single();

  if (error || !profile) {
    console.error("[auth] getUserRole error:", error?.message ?? "no profile");
    return null;
  }

  return profile.role as AppRole;
}
