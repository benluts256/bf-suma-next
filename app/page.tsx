// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — ROOT PAGE
// app/page.tsx
// Middleware handles session-aware redirects; this is the unauthenticated fallback.
// ═══════════════════════════════════════════════════════════════════════════════

import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { ROLE_ROUTES } from '@/lib/auth/config';
import type { AppRole } from '@/types';

export default async function RootPage() {
  const supabase = await getSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('auth_user_id', user.id)
    .single();

  redirect(ROLE_ROUTES[(profile?.role as AppRole) ?? 'client'] ?? '/client/dashboard');
}
