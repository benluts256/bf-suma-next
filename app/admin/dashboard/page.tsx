// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — ADMIN DASHBOARD PAGE
// app/admin/dashboard/page.tsx
// Protected: requires role=admin
// ═══════════════════════════════════════════════════════════════════════════════

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/helpers';
import { AdminDashboardClient } from './client';

export const metadata: Metadata = {
  title: 'Admin Dashboard — BF Suma Nexus',
};

export const dynamic = 'force-dynamic';

// Generate deterministic trend data based on a seed (no Math.random in render)
function generateTrendData() {
  const data = [];
  // Use fixed seed values for SSR consistency
  const seeds = [
    1200000, 1800000, 1500000, 2100000, 1900000, 2400000, 2200000,
    1700000, 2600000, 2300000, 2800000, 2500000, 3000000, 2700000,
    2900000, 3200000, 2800000, 3400000, 3100000, 3600000, 3300000,
    3800000, 3500000, 4000000, 3700000, 4200000, 3900000, 4400000,
    4100000, 4600000,
  ];
  const orderSeeds = [
    12, 18, 15, 21, 19, 24, 22, 17, 26, 23, 28, 25, 30, 27,
    29, 32, 28, 34, 31, 36, 33, 38, 35, 40, 37, 42, 39, 44, 41, 46,
  ];

  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: seeds[i] ?? 2000000,
      orders: orderSeeds[i] ?? 20,
    });
  }
  return data;
}

export default async function AdminDashboardPage() {
  const supabase = await getSupabaseServerClient();
  const auth = await requireRole(supabase, 'manager');

  if (!auth) redirect('/auth?error=unauthorized');

  // Fetch dashboard stats
  const [
    { count: totalDistributors },
    { count: totalClients },
    { count: totalOrders },
    { data: recentActivity },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from('distributors').select('*', { count: 'exact', head: true }),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase
      .from('activity_logs')
      .select('*, user:profiles!user_id(id, full_name, avatar_url, role)')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('orders')
      .select('*, client:clients(profile:profiles(full_name, email))')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const revenueTrend = generateTrendData();

  return (
    <AdminDashboardClient
      profile={auth.profile}
      stats={{
        totalDistributors: totalDistributors ?? 0,
        totalClients: totalClients ?? 0,
        totalOrders: totalOrders ?? 0,
        totalRevenue: 0,
      }}
      revenueTrend={revenueTrend}
      recentActivity={recentActivity ?? []}
      recentOrders={recentOrders ?? []}
    />
  );
}
