'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — REAL-TIME MESSAGING CLIENT COMPONENT
// app/distributor/messages/client.tsx
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  LayoutDashboard, Users, Package, MessageSquare,
  MapPin, Send, ArrowLeft,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getInitials, timeAgo } from '@/lib/utils/format';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Profile } from '@/types';

// ── Nav items ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/distributor/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/distributor/clients', label: 'My Clients', icon: <Users className="w-4 h-4" /> },
  { href: '/distributor/orders', label: 'Orders', icon: <Package className="w-4 h-4" /> },
  { href: '/distributor/messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4" /> },
  { href: '/distributor/location', label: 'Location', icon: <MapPin className="w-4 h-4" /> },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface ConversationMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender?: { id: string; full_name: string; avatar_url?: string };
  receiver?: { id: string; full_name: string; avatar_url?: string };
}

interface MessagesClientProps {
  profile: Profile;
  conversations: ConversationMessage[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function MessagesClient({ profile, conversations }: MessagesClientProps) {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  // Get partner info from conversation
  const getPartner = useCallback(
    (msg: ConversationMessage) => {
      return msg.sender_id === profile.id ? msg.receiver : msg.sender;
    },
    [profile.id]
  );

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedPartnerId) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, sender:profiles!sender_id(id, full_name, avatar_url)')
        .or(
          `and(sender_id.eq.${profile.id},receiver_id.eq.${selectedPartnerId}),and(sender_id.eq.${selectedPartnerId},receiver_id.eq.${profile.id})`
        )
        .order('created_at', { ascending: true })
        .limit(50);

      setMessages((data as ConversationMessage[]) ?? []);
    };

    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${profile.id}:${selectedPartnerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${profile.id}`,
        },
        (payload: RealtimePostgresChangesPayload<ConversationMessage>) => {
          const msg = payload.new as ConversationMessage;
          if (msg.sender_id === selectedPartnerId) {
            setMessages((prev) => [...prev, msg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedPartnerId, profile.id, supabase]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedPartnerId || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    const { data } = await supabase
      .from('messages')
      .insert({
        sender_id: profile.id,
        receiver_id: selectedPartnerId,
        content,
        message_type: 'text',
      })
      .select()
      .single();

    if (data) {
      setMessages((prev) => [...prev, data as ConversationMessage]);
    }
    setSending(false);
  };

  const selectedPartner = conversations.find(
    (c) => getPartner(c)?.id === selectedPartnerId
  );
  const partnerInfo = selectedPartner ? getPartner(selectedPartner) : null;

  return (
    <DashboardLayout
      profile={profile}
      navItems={NAV_ITEMS}
      title="Messages"
      brandLabel="Distributor Portal"
    >
      <div className="flex h-full">
        {/* Conversation list */}
        <div className={`w-full md:w-72 border-r border-zinc-200 dark:border-zinc-800 flex-shrink-0 ${selectedPartnerId ? 'hidden md:flex' : 'flex'} flex-col`}>
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Conversations
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-zinc-400 text-sm px-4">
                No conversations yet
              </div>
            ) : (
              conversations.map((conv) => {
                const partner = getPartner(conv);
                if (!partner) return null;
                return (
                  <button
                    key={partner.id}
                    onClick={() => setSelectedPartnerId(partner.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left ${
                      selectedPartnerId === partner.id
                        ? 'bg-emerald-50 dark:bg-emerald-900/10'
                        : ''
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 text-xs font-bold flex-shrink-0">
                      {getInitials(partner.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                        {partner.full_name}
                      </p>
                      <p className="text-xs text-zinc-400 truncate">
                        {conv.content}
                      </p>
                    </div>
                    <span className="text-[10px] text-zinc-400 flex-shrink-0">
                      {timeAgo(conv.created_at)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className={`flex-1 flex flex-col ${!selectedPartnerId ? 'hidden md:flex' : 'flex'}`}>
          {!selectedPartnerId ? (
            <div className="flex-1 flex items-center justify-center text-zinc-400">
              <div className="text-center">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Select a conversation</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="h-14 flex items-center gap-3 px-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                <button
                  onClick={() => setSelectedPartnerId(null)}
                  className="md:hidden text-zinc-400 hover:text-zinc-600"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 text-xs font-bold">
                  {getInitials(partnerInfo?.full_name ?? 'U')}
                </div>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {partnerInfo?.full_name ?? 'Unknown'}
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const isMine = msg.sender_id === profile.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                          isMine
                            ? 'bg-emerald-600 text-white rounded-br-sm'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-sm'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? 'text-emerald-200' : 'text-zinc-400'}`}>
                          {timeAgo(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sending}
                    className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
