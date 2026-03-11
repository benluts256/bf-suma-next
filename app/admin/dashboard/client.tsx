'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — ADMIN DASHBOARD CLIENT COMPONENT
// app/admin/dashboard/client.tsx
// ═══════════════════════════════════════════════════════════════════════════════

import dynamic from 'next/dynamic';
import {
  Users, Package, TrendingUp, DollarSign,
  LayoutDashboard, Settings, ShieldCheck, Truck, BarChart3,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { StatsCard } from '@/components/ui/stats-card';
import { ActivityFeed } from '@/components/ui/activity-feed';
import { formatUGX } from '@/lib/utils/format';
import type { Profile, ActivityLog } from '@/types';

// Lazy-load charts to reduce initial bundle
const RevenueTrendChart = dynamic(
  () => import('@/components/charts/revenue-chart').then((m) => m.RevenueTrendChart),
  { ssr: false, loading: () => <div className="h-[220px] bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" /> }
);

const OrdersBarChart = dynamic(
  () => import('@/components/charts/revenue-chart').then((m) => m.OrdersBarChart),
  { ssr: false, loading: () => <div className="h-[220px] bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" /> }
);

// ── Nav items ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/admin/distributors', label: 'Distributors', icon: <Truck className="w-4 h-4" /> },
  { href: '/admin/clients', label: 'Clients', icon: <Users className="w-4 h-4" /> },
  { href: '/admin/analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
  { href: '/admin/settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  { href: '/admin/mfa', label: 'Security', icon: <ShieldCheck className="w-4 h-4" /> },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface RevenueTrendItem {
  date: string;
  revenue: number;
  orders: number;
}

interface AdminDashboardClientProps {
  profile: Profile;
  stats: {
    totalDistributors: number;
    totalClients: number;
    totalOrders: number;
    totalRevenue: number;
  };
  revenueTrend: RevenueTrendItem[];
  recentActivity: ActivityLog[];
  recentOrders: Record<string, unknown>[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function AdminDashboardClient({
  profile,
  stats,
  revenueTrend,
  recentActivity,
}: AdminDashboardClientProps) {
  return (
    <DashboardLayout
      profile={profile}
      navItems={NAV_ITEMS}
      title="Admin Dashboard"
      brandLabel="Command Center"
    >
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Distributors"
            value={stats.totalDistributors}
            change={12}
            changeLabel="vs last month"
            icon={<Truck className="w-5 h-5" />}
          />
          <StatsCard
            title="Total Clients"
            value={stats.totalClients}
            change={8}
            changeLabel="vs last month"
            icon={<Users className="w-5 h-5" />}
          />
          <StatsCard
            title="Total Orders"
            value={stats.totalOrders}
            change={-3}
            changeLabel="vs last month"
            icon={<Package className="w-5 h-5" />}
          />
          <StatsCard
            title="Total Revenue"
            value={formatUGX(stats.totalRevenue, true)}
            change={15}
            changeLabel="vs last month"
            icon={<DollarSign className="w-5 h-5" />}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Revenue Trend
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">Last 30 days</p>
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <RevenueTrendChart data={revenueTrend} />
          </div>

          {/* Orders Volume */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Order Volume
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">Last 30 days</p>
              </div>
              <Package className="w-4 h-4 text-emerald-500" />
            </div>
            <OrdersBarChart data={revenueTrend} />
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Recent Activity
            </h3>
            <span className="text-xs text-zinc-400">Live</span>
          </div>
          <ActivityFeed activities={recentActivity} maxItems={10} />
        </div>
      </div>
    </DashboardLayout>
  );
}
