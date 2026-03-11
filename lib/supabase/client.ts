// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — Supabase Browser Client
// lib/supabase/client.ts
// ═══════════════════════════════════════════════════════════════════════════════

import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  client = createBrowserClient(url, anonKey);
  return client;
}
