// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — Centralized Auth Utilities
// File: lib/auth.ts
// Single source of truth for role routes, auth helpers, and type definitions.
// ═══════════════════════════════════════════════════════════════════════════════

import type { SupabaseClient } from "@supabase/supabase-js";

// ── Role types ────────────────────────────────────────────────────────────────

export type AppRole = "admin" | "manager" | "distributor" | "client";

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
 * Queries the `user_roles` table for the given user's active role.
 * Returns the role string or `null` if no role is found.
 */
export async function getUserRole(
  supabase: SupabaseClient,
  userId: string
): Promise<AppRole | null> {
  const { data: roleRow, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("auth_user_id", userId)
    .eq("is_active", true)
    .single();

  if (error || !roleRow) {
    console.error("[auth] getUserRole error:", error?.message ?? "no role row");
    return null;
  }

  return roleRow.role as AppRole;
}
