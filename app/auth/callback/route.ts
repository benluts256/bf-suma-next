// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS v6.0 — AUTH CALLBACK ROUTE
// File: app/auth/callback/route.ts
// Handles OAuth redirects and email confirmation links from Supabase Auth.
// Exchanges the one-time code for a session, then routes by role.
// ═══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@supabase/ssr";
import { cookies }            from "next/headers";
import { NextResponse }       from "next/server";
import type { NextRequest }   from "next/server";
import { ROLE_ROUTES }        from "@/lib/auth";
import type { AppRole }       from "@/lib/auth";
import { validateEnv }        from "@/lib/supabase-config";

/** Validates that a redirect target is a safe relative path */
function safeRedirectPath(path: string | null): string | null {
  if (!path) return null;
  // Must start with / and not be protocol-relative (//)
  if (path.startsWith('/') && !path.startsWith('//')) return path;
  return null;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code       = requestUrl.searchParams.get("code");
  const next       = requestUrl.searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(new URL("/auth?error=missing_code", requestUrl.origin));
  }

  const { url, anonKey } = validateEnv();
  const cookieStore = await cookies();
  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // Exchange code → session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.error("[Auth Callback] Session exchange error:", error?.message);
    return NextResponse.redirect(new URL("/auth?error=session_failed", requestUrl.origin));
  }

  const user = data.session.user;

  // ── Check if role exists in user metadata (set during signup) ──
  const userMetadataRole = user.user_metadata?.role as string | undefined;
  
  // If role exists in metadata but not in user_roles table, insert it
  if (userMetadataRole && ["distributor", "client"].includes(userMetadataRole)) {
    // Check if role already exists in user_roles
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("auth_user_id", user.id)
      .single();

    if (!existingRole) {
      // Insert the role from metadata into user_roles table
      await supabase.from("user_roles").insert({
        auth_user_id: user.id,
        role: userMetadataRole,
        is_active: true
      });
      
      console.log(`[Auth Callback] Inserted role '${userMetadataRole}' for user ${user.id}`);
    }
  }

  // Resolve user role
  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();

  const resolvedRole = (roleRow?.role ?? "client") as AppRole;

  // Managers must pass MFA before accessing dashboard
  if (resolvedRole === "manager") {
    const { data: mgrProfile } = await supabase
      .from("manager_profiles")
      .select("mfa_verified_at")
      .eq("auth_user_id", user.id)
      .single();

    const mfaValid =
      mgrProfile?.mfa_verified_at &&
      new Date(mgrProfile.mfa_verified_at) > new Date(Date.now() - 8 * 60 * 60 * 1000);

    if (!mfaValid) {
      return NextResponse.redirect(new URL("/admin/mfa", requestUrl.origin));
    }
  }

  const destination = safeRedirectPath(next) ?? ROLE_ROUTES[resolvedRole] ?? "/client/analytics";
  return NextResponse.redirect(new URL(destination, requestUrl.origin));
}
