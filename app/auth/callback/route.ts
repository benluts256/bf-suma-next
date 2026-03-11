// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — AUTH CALLBACK ROUTE
// app/auth/callback/route.ts
// Handles OAuth redirects and email confirmation links from Supabase Auth.
// Exchanges the one-time code for a session, then routes by role.
// ═══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ROLE_ROUTES } from '@/lib/auth/config';
import type { AppRole } from '@/types';

/** Validates that a redirect target is a safe relative path */
function safeRedirectPath(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('/') && !path.startsWith('//')) return path;
  return null;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');

  if (!code) {
    return NextResponse.redirect(new URL('/auth?error=missing_code', requestUrl.origin));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    console.error('[Auth Callback] Session exchange error:', error?.message);
    return NextResponse.redirect(new URL('/auth?error=session_failed', requestUrl.origin));
  }

  const user = data.session.user;

  // Get user's role from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('auth_user_id', user.id)
    .single();

  const resolvedRole = (profile?.role ?? 'client') as AppRole;
  const destination = safeRedirectPath(next) ?? ROLE_ROUTES[resolvedRole] ?? '/client/dashboard';

  return NextResponse.redirect(new URL(destination, requestUrl.origin));
}
