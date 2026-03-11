// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — NEXT.JS MIDDLEWARE
// middleware.ts
// Protects role-based routes · redirects unauthenticated users to /auth
// ═══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ROLE_ROUTES, PROTECTED_PREFIXES } from '@/lib/auth/config';
import type { AppRole } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // ── 1. Static / public assets — skip ──────────────────────────────────────
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api/public') ||
    path.startsWith('/favicon') ||
    /\.(png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|otf|css|js)$/.test(path)
  ) {
    return NextResponse.next();
  }

  // ── 2. Auth callback — always allow ───────────────────────────────────────
  if (path.startsWith('/auth/callback')) {
    return NextResponse.next();
  }

  // ── 3. Create Supabase client ─────────────────────────────────────────────
  const res = NextResponse.next({ request: req });
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

  // ── 4. Validate user ──────────────────────────────────────────────────────
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user && !userErr;

  // ── 5. Unauthenticated → redirect to /auth ────────────────────────────────
  if (!isAuthenticated) {
    if (path === '/auth' || path === '/' || path.startsWith('/public')) {
      return res;
    }
    const redirectUrl = new URL('/auth', req.url);
    redirectUrl.searchParams.set('next', path);
    return NextResponse.redirect(redirectUrl);
  }

  // ── 6. Authenticated users on /auth → send to their dashboard ─────────────
  if (path === '/auth') {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('auth_user_id', user.id)
        .single();

      const dest = ROLE_ROUTES[(profile?.role as AppRole) ?? 'client'];
      return NextResponse.redirect(new URL(dest, req.url));
    } catch {
      return NextResponse.redirect(new URL('/client/dashboard', req.url));
    }
  }

  // ── 7. Root → redirect to dashboard ──────────────────────────────────────
  if (path === '/') {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('auth_user_id', user.id)
        .single();

      const dest = ROLE_ROUTES[(profile?.role as AppRole) ?? 'client'];
      return NextResponse.redirect(new URL(dest, req.url));
    } catch {
      return NextResponse.redirect(new URL('/client/dashboard', req.url));
    }
  }

  // ── 8. Role-based route enforcement ───────────────────────────────────────
  const requiredRole = Object.entries(PROTECTED_PREFIXES).find(([prefix]) =>
    path.startsWith(prefix)
  )?.[1];

  if (requiredRole) {
    let userRole: AppRole | null = null;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('auth_user_id', user.id)
        .single();

      userRole = (profile?.role as AppRole) ?? null;
    } catch {
      return NextResponse.redirect(new URL('/auth?error=role_lookup_failed', req.url));
    }

    if (!userRole) {
      return NextResponse.redirect(new URL('/auth?error=no_role', req.url));
    }

    if (userRole !== requiredRole) {
      const correctDest = ROLE_ROUTES[userRole];
      return NextResponse.redirect(new URL(correctDest, req.url));
    }
  }

  return res;
}

// ─────────────────────────────────────────────────────────────────────────────
// MATCHER
// ─────────────────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
