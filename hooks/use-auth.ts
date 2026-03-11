// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — useAuth Hook
// hooks/use-auth.ts
// Client-side auth state management
// ═══════════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { ROLE_ROUTES } from '@/lib/auth/config';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { AppRole, Profile } from '@/types';

interface AuthState {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setState({ user: null, profile: null, loading: false, error: null });
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();

        setState({
          user: { id: user.id, email: user.email ?? '' },
          profile: profile as Profile | null,
          loading: false,
          error: null,
        });
      } catch (err) {
        setState({
          user: null,
          profile: null,
          loading: false,
          error: err instanceof Error ? err.message : 'Auth error',
        });
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_OUT' || !session) {
          setState({ user: null, profile: null, loading: false, error: null });
          return;
        }

        if (event === 'SIGNED_IN' && session.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('auth_user_id', session.user.id)
            .single();

          setState({
            user: { id: session.user.id, email: session.user.email ?? '' },
            profile: profile as Profile | null,
            loading: false,
            error: null,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  }, [supabase, router]);

  const redirectToDashboard = useCallback(
    (role?: AppRole) => {
      const r = role ?? state.profile?.role ?? 'client';
      router.push(ROLE_ROUTES[r]);
    },
    [router, state.profile]
  );

  return {
    ...state,
    signOut,
    redirectToDashboard,
    isAdmin: state.profile?.role === 'admin',
    isDistributor: state.profile?.role === 'distributor',
    isClient: state.profile?.role === 'client',
  };
}
