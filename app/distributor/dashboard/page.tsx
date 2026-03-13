// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — DISTRIBUTOR DASHBOARD PAGE
// app/distributor/dashboard/page.tsx
// Protected: requires role=distributor
// ═══════════════════════════════════════════════════════════════════════════════

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/helpers';
import { DistributorDashboardClient } from './client';

export const metadata: Metadata = {
  title: 'Distributor Dashboard — BF Suma Nexus',
};

export const dynamic = 'force-dynamic';

export default async function DistributorDashboardPage() {
  const supabase = await getSupabaseServerClient();
  const auth = await requireRole(supabase, 'distributor');

  if (!auth) redirect('/auth?error=unauthorized');
  if (!auth.distributor) redirect('/auth?error=profile_not_found');

  // Fetch distributor-specific data
  const [
    { data: distributor },
    { data: assignedClients },
    { data: recentOrders },
    { data: recentMessages },
  ] = await Promise.all([
    supabase
      .from('distributors')
      .select('*')
      .eq('profile_id', auth.profile.id)
      .single(),
    supabase
      .from('clients')
      .select('*, profile:profiles(full_name, email, avatar_url)')
      .eq('distributor_id', auth.distributor.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('orders')
      .select('*, client:clients(profile:profiles(full_name, email))')
      .eq('distributor_id', auth.distributor.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(full_name, avatar_url)')
      .eq('receiver_id', auth.profile.id)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  return (
    <DistributorDashboardClient
      profile={auth.profile}
      distributor={distributor}
      assignedClients={assignedClients ?? []}
      recentOrders={recentOrders ?? []}
      unreadMessages={recentMessages?.length ?? 0}
    />
  );
}
