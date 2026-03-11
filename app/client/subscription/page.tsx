// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — CLIENT SUBSCRIPTION PAGE
// app/client/subscription/page.tsx
// Stripe billing plans and subscription management
// ═══════════════════════════════════════════════════════════════════════════════

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/helpers';
import { SubscriptionClient } from './client';

export const metadata: Metadata = {
  title: 'Subscription — BF Suma Nexus',
};

export const dynamic = 'force-dynamic';

export default async function SubscriptionPage() {
  const supabase = await getSupabaseServerClient();
  const auth = await requireRole(supabase, 'client');

  if (!auth) redirect('/auth?error=unauthorized');

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('profile_id', auth.profile.id)
    .single();

  return (
    <SubscriptionClient
      profile={auth.profile}
      subscription={subscription}
    />
  );
}
