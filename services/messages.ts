// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — Message Service
// services/messages.ts
// ═══════════════════════════════════════════════════════════════════════════════

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Message } from '@/types';

export async function getConversation(
  supabase: SupabaseClient,
  profileId: string,
  otherProfileId: string,
  limit = 50
): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!sender_id(*), receiver:profiles!receiver_id(*)')
    .or(
      `and(sender_id.eq.${profileId},receiver_id.eq.${otherProfileId}),and(sender_id.eq.${otherProfileId},receiver_id.eq.${profileId})`
    )
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) return [];
  return data as Message[];
}

export async function sendMessage(
  supabase: SupabaseClient,
  senderId: string,
  receiverId: string,
  content: string,
  messageType: 'text' | 'image' | 'system' = 'text'
): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      content,
      message_type: messageType,
    })
    .select()
    .single();

  if (error) return null;
  return data as Message;
}

export async function markAsRead(
  supabase: SupabaseClient,
  messageIds: string[]
): Promise<void> {
  await supabase
    .from('messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .in('id', messageIds);
}

export async function getUnreadCount(
  supabase: SupabaseClient,
  profileId: string
): Promise<number> {
  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', profileId)
    .eq('is_read', false);

  return count ?? 0;
}

export async function getConversationList(
  supabase: SupabaseClient,
  profileId: string
) {
  // Get latest message from each conversation partner
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!sender_id(id, full_name, avatar_url), receiver:profiles!receiver_id(id, full_name, avatar_url)')
    .or(`sender_id.eq.${profileId},receiver_id.eq.${profileId}`)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error || !data) return [];

  // Group by conversation partner and get latest message
  const conversations = new Map<string, Message>();
  for (const msg of data as Message[]) {
    const partnerId = msg.sender_id === profileId ? msg.receiver_id : msg.sender_id;
    if (!conversations.has(partnerId)) {
      conversations.set(partnerId, msg);
    }
  }

  return Array.from(conversations.values());
}
