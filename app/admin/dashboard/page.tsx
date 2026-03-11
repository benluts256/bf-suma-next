// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS v6.0 — ADMIN DASHBOARD PAGE
// File: app/admin/dashboard/page.tsx
// Protected by middleware: requires role=manager + MFA verified
// ═══════════════════════════════════════════════════════════════════════════════

import type { Metadata } from "next";
import { redirect }      from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import AdminCommandCenter from "@/components/admin-command-center";

export const metadata: Metadata = {
  title: "Admin Dashboard — BF Suma Nexus",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("manager_profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) redirect("/auth?error=profile_not_found");

  return (
    <AdminCommandCenter
      user={{
        id:          user.id,
        email:       user.email ?? "",
        fullName:    profile.full_name,
        role:        "manager",
        accessLevel: profile.access_level,
      }}
    />
  );
}
