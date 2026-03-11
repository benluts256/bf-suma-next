// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — DISTRIBUTOR MESSAGES PAGE
// app/distributor/messages/page.tsx
// Real-time messaging with clients
// ═══════════════════════════════════════════════════════════════════════════════

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/helpers';
import { MessagesClient } from './client';

export const metadata: Metadata = {
  title: 'Messages — BF Suma Nexus',
};

export const dynamic = 'force-dynamic';

export default async function DistributorMessagesPage() {
  const supabase = await getSupabaseServerClient();
  const auth = await requireRole(supabase, 'distributor');

  if (!auth) redirect('/auth?error=unauthorized');

  // Get conversation list
  const { data: conversations } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!sender_id(id, full_name, avatar_url),
      receiver:profiles!receiver_id(id, full_name, avatar_url)
    `)
    .or(`sender_id.eq.${auth.profile.id},receiver_id.eq.${auth.profile.id}`)
    .order('created_at', { ascending: false })
    .limit(100);

  // Deduplicate to get unique conversation partners
  const seen = new Set<string>();
  const uniqueConversations: typeof conversations = [];
  for (const msg of conversations ?? []) {
    const partnerId = msg.sender_id === auth.profile.id ? msg.receiver_id : msg.sender_id;
    if (!seen.has(partnerId)) {
      seen.add(partnerId);
      uniqueConversations.push(msg);
    }
  }

  return (
    <MessagesClient
      profile={auth.profile}
      conversations={uniqueConversations}
    />
  );
}
