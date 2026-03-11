// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS v6.0 — NEXT.JS MIDDLEWARE
// middleware.ts  (place at project root, same level as /app)
// Protects all role-based routes · redirects unauthenticated users to /auth
// Enforces MFA window (8 hrs) for manager routes
// ═══════════════════════════════════════════════════════════════════════════════

import { createServerClient }     from "@supabase/ssr";
import { NextResponse }           from "next/server";
import type { NextRequest }       from "next/server";
import { ROLE_ROUTES }            from "@/lib/auth";

const PROTECTED_PREFIXES: Record<string, string> = {
  "/admin":       "manager",
  "/distributor": "distributor",
  "/client":      "client",
};

// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // ── 1. Static / public assets — skip (BEFORE any auth calls) ──────────────
  if (
    path.startsWith("/_next") ||
    path.startsWith("/api/public") ||
    path.startsWith("/favicon") ||
    path.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|otf)$/)
  ) {
    return NextResponse.next();
  }

  // ── 2. Auth callback — always allow ───────────────────────────────────────
  if (path.startsWith("/auth/callback")) {
    return NextResponse.next();
  }

  // ── 3. Create Supabase client and validate user ───────────────────────────
  const res      = NextResponse.next({ request: req });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user && !userErr;

  // ── 4. Unauthenticated → redirect to /auth ────────────────────────────────
  if (!isAuthenticated) {
    if (path === "/auth" || path === "/" || path.startsWith("/public")) {
      return res;
    }
    const redirectUrl = new URL("/auth", req.url);
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  // ── 5. Authenticated users on /auth → send to their dashboard ─────────────
  if (path === "/auth") {
    try {
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("auth_user_id", user.id)
        .eq("is_active", true)
        .single();

      const dest = ROLE_ROUTES[roleRow?.role ?? "client"] ?? "/client/analytics";
      return NextResponse.redirect(new URL(dest, req.url));
    } catch {
      return NextResponse.redirect(new URL("/client/analytics", req.url));
    }
  }

  // ── 6. Root → redirect to dashboard ──────────────────────────────────────
  if (path === "/") {
    try {
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("auth_user_id", user.id)
        .eq("is_active", true)
        .single();
      const dest = ROLE_ROUTES[roleRow?.role ?? "client"] ?? "/client/analytics";
      return NextResponse.redirect(new URL(dest, req.url));
    } catch {
      return NextResponse.redirect(new URL("/client/analytics", req.url));
    }
  }

  // ── 7. Role-based route enforcement ───────────────────────────────────────
  const requiredRole = Object.entries(PROTECTED_PREFIXES).find(([prefix]) =>
    path.startsWith(prefix)
  )?.[1];

  if (requiredRole) {
    let userRole: string | null = null;

    try {
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("auth_user_id", user.id)
        .eq("is_active", true)
        .single();
      userRole = roleRow?.role ?? null;
    } catch {
      return NextResponse.redirect(new URL("/auth?error=role_lookup_failed", req.url));
    }

    if (!userRole) {
      return NextResponse.redirect(new URL("/auth?error=no_role", req.url));
    }

    if (userRole !== requiredRole) {
      const correctDest = ROLE_ROUTES[userRole] ?? "/client/analytics";
      return NextResponse.redirect(new URL(correctDest, req.url));
    }

    // ── 8. Manager MFA enforcement ─────────────────────────────────────────
    if (requiredRole === "manager" && path !== "/admin/mfa") {
      try {
        const { data: mgrProfile } = await supabase
          .from("manager_profiles")
          .select("mfa_verified_at")
          .eq("auth_user_id", user.id)
          .single();

        const mfaValid =
          mgrProfile?.mfa_verified_at &&
          new Date(mgrProfile.mfa_verified_at) >
            new Date(Date.now() - 8 * 60 * 60 * 1000);

        if (!mfaValid) {
          return NextResponse.redirect(new URL("/admin/mfa", req.url));
        }
      } catch {
        return NextResponse.redirect(new URL("/admin/mfa", req.url));
      }
    }
  }

  return res;
}

// ─────────────────────────────────────────────────────────────────────────────
// MATCHER — apply middleware to all routes except static files
// ─────────────────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
