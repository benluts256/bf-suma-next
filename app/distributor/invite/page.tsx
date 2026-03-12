// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — DISTRIBUTOR INVITE CLIENTS PAGE
// app/distributor/invite/page.tsx
// Protected: requires role=distributor
// ═══════════════════════════════════════════════════════════════════════════════

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/helpers';
import { DistributorInviteClient } from './client';

export const metadata: Metadata = {
  title: 'Invite Clients — BF Suma Nexus',
};

export const dynamic = 'force-dynamic';

export default async function DistributorInvitePage() {
  const supabase = await getSupabaseServerClient();
  const auth = await requireRole(supabase, 'distributor');

  if (!auth) redirect('/auth?error=unauthorized');

  // Fetch existing invites
  const { data: invites } = await supabase
    .from('client_invites')
    .select(`
      *,
      client:clients(id, profile:profiles(full_name, email))
    `)
    .eq('distributor_id', auth.distributor!.id)
    .order('created_at', { ascending: false });

  return (
    <DistributorInviteClient
      profile={auth.profile}
      distributor={auth.distributor}
      invites={invites || []}
    />
  );
}