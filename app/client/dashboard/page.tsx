// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — CLIENT DASHBOARD PAGE
// app/client/dashboard/page.tsx
// Protected: requires role=client
// ═══════════════════════════════════════════════════════════════════════════════

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/helpers';
import { ClientDashboardClient } from './client';

export const metadata: Metadata = {
  title: 'My Dashboard — BF Suma Nexus',
};

export const dynamic = 'force-dynamic';

export default async function ClientDashboardPage() {
  const supabase = await getSupabaseServerClient();
  const auth = await requireRole(supabase, 'client');

  if (!auth) redirect('/auth?error=unauthorized');
  if (!auth.client) redirect('/auth?error=profile_not_found');

  // Fetch client-specific data
  const [
    { data: clientRecord },
    { data: recentOrders },
  ] = await Promise.all([
    supabase
      .from('clients')
      .select('*, distributor:distributors(distributor_code, rank, profile:profiles(full_name, email))')
      .eq('profile_id', auth.profile.id)
      .single(),
    supabase
      .from('orders')
      .select('*')
      .eq('client_id', auth.client.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  return (
    <ClientDashboardClient
      profile={auth.profile}
      clientRecord={clientRecord}
      recentOrders={recentOrders ?? []}
    />
  );
}
