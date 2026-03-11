// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS v6.0 — ROOT PAGE
// File: app/page.tsx
// Middleware handles session-aware redirects; this is the unauthenticated fallback.
// ═══════════════════════════════════════════════════════════════════════════════

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { ROLE_ROUTES } from "@/lib/auth";

export default async function RootPage() {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .single();

  redirect(ROLE_ROUTES[roleRow?.role ?? "client"] ?? "/client/analytics");
}