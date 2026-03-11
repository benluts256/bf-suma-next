// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS v6.0 — DISTRIBUTOR DASHBOARD PAGE
// File: app/distributor/dashboard/page.tsx
// Protected by middleware: requires role=distributor
// ═══════════════════════════════════════════════════════════════════════════════

import type { Metadata } from "next";
import { redirect }      from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import PageMobileNav from "@/components/page-mobile-nav";

export const metadata: Metadata = {
  title: "Distributor Dashboard — BF Suma Nexus",
};

export const dynamic = "force-dynamic";

export default async function DistributorDashboardPage() {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("distributor_profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) redirect("/auth?error=profile_not_found");

  return (
    <>
    <PageMobileNav role="distributor" />
    <main className="min-h-[100dvh] bg-[#f8f9f6] p-4 pt-16 md:p-8 pb-20 md:pb-8">
      <h1 className="text-xl md:text-2xl font-bold text-[#1a3a1a] mb-2">
        Welcome, Distributor {profile.full_name ?? user.email}
      </h1>
      <p className="text-zinc-500 text-sm mb-6 md:mb-8">
        Your rank: {profile.rank ?? "Bronze"} | Points: {profile.rank_points ?? 0}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 md:p-6 rounded-xl border border-[#e8ede8]">
          <p className="text-xs text-zinc-400 uppercase tracking-wide">Total Sales</p>
          <p className="text-lg md:text-xl font-mono font-bold text-[#228B22]">
            UGX {profile.total_sales_ugx?.toLocaleString() ?? "0"}
          </p>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-xl border border-[#e8ede8]">
          <p className="text-xs text-zinc-400 uppercase tracking-wide">Clients</p>
          <p className="text-lg md:text-xl font-mono font-bold text-[#1a3a1a]">—</p>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-xl border border-[#e8ede8]">
          <p className="text-xs text-zinc-400 uppercase tracking-wide">Orders</p>
          <p className="text-lg md:text-xl font-mono font-bold text-[#1a3a1a]">—</p>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-xl border border-[#e8ede8]">
          <p className="text-xs text-zinc-400 uppercase tracking-wide">Commission</p>
          <p className="text-lg md:text-xl font-mono font-bold text-[#D4AF37]">—</p>
        </div>
      </div>
    </main>
    </>
  );
}
