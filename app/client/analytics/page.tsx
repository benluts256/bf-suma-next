// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS v6.0 — CLIENT ANALYTICS PAGE
// File: app/client/analytics/page.tsx
// Protected by middleware: requires role=client
// ═══════════════════════════════════════════════════════════════════════════════

import type { Metadata } from "next";
import { redirect }      from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import PageMobileNav from "@/components/page-mobile-nav";

export const metadata: Metadata = {
  title: "Analytics — BF Suma Nexus",
};

export const dynamic = "force-dynamic";

export default async function ClientAnalyticsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("clients")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) redirect("/auth?error=profile_not_found");

  return (
    <>
      <PageMobileNav role="client" />
      <main className="min-h-[100dvh] bg-[#f8f9f6] p-4 pt-16 md:p-8 pb-20 md:pb-8">
        <h1 className="text-xl md:text-2xl font-bold text-[#1a3a1a] mb-2">
          Welcome, {profile.full_name ?? user.email}
        </h1>
        <p className="text-zinc-500 text-sm">
          Your wellness analytics dashboard. More features coming soon.
        </p>
      </main>
    </>
  );
}
