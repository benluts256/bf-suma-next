'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — DISTRIBUTOR DASHBOARD CLIENT COMPONENT
// app/distributor/dashboard/client.tsx
// ═══════════════════════════════════════════════════════════════════════════════

import {
  LayoutDashboard, Users, Package, MessageSquare,
  MapPin, TrendingUp, Star, DollarSign,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { StatsCard } from '@/components/ui/stats-card';
import { formatUGX, timeAgo } from '@/lib/utils/format';
import type { Profile, Distributor } from '@/types';

// ── Nav items ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/distributor/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/distributor/clients', label: 'My Clients', icon: <Users className="w-4 h-4" /> },
  { href: '/distributor/orders', label: 'Orders', icon: <Package className="w-4 h-4" /> },
  { href: '/distributor/messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4" /> },
  { href: '/distributor/location', label: 'Location', icon: <MapPin className="w-4 h-4" /> },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface AssignedClient {
  id: string;
  profile?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  total_orders: number;
  total_spent: number;
  last_order_at?: string;
}

interface RecentOrder {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  client?: {
    profile?: {
      full_name: string;
      email: string;
    };
  };
}

interface DistributorDashboardClientProps {
  profile: Profile;
  distributor: Distributor | null;
  assignedClients: AssignedClient[];
  recentOrders: RecentOrder[];
  unreadMessages: number;
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    canceled: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${colors[status] ?? 'bg-zinc-100 text-zinc-600'}`}>
      {status}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function DistributorDashboardClient({
  profile,
  distributor,
  assignedClients,
  recentOrders,
  unreadMessages,
}: DistributorDashboardClientProps) {
  const navItems = NAV_ITEMS.map((item) =>
    item.href === '/distributor/messages'
      ? { ...item, badge: unreadMessages }
      : item
  );

  return (
    <DashboardLayout
      profile={profile}
      navItems={navItems}
      title="Distributor Dashboard"
      brandLabel="Distributor Portal"
    >
      <div className="p-6 space-y-6">
        {/* Welcome banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Welcome back,</p>
              <h2 className="text-xl font-bold mt-0.5">{profile.full_name}</h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-sm text-emerald-100">
                  <Star className="w-3.5 h-3.5 text-yellow-300" />
                  {distributor?.rank ?? 'Bronze'} Rank
                </span>
                <span className="text-emerald-300">·</span>
                <span className="text-sm text-emerald-100">
                  {distributor?.rank_points ?? 0} points
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-emerald-100 text-xs">Distributor Code</p>
              <p className="font-mono font-bold text-sm mt-0.5">
                {distributor?.distributor_code ?? '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Sales"
            value={formatUGX(distributor?.total_sales ?? 0, true)}
            change={8}
            changeLabel="vs last month"
            icon={<DollarSign className="w-5 h-5" />}
          />
          <StatsCard
            title="Assigned Clients"
            value={assignedClients.length}
            icon={<Users className="w-5 h-5" />}
          />
          <StatsCard
            title="Recent Orders"
            value={recentOrders.length}
            icon={<Package className="w-5 h-5" />}
          />
          <StatsCard
            title="Commission Rate"
            value={`${((distributor?.commission_rate ?? 0.15) * 100).toFixed(0)}%`}
            icon={<TrendingUp className="w-5 h-5" />}
          />
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assigned Clients */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Assigned Clients
              </h3>
              <a
                href="/distributor/clients"
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                View all →
              </a>
            </div>
            {assignedClients.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-6">
                No clients assigned yet
              </p>
            ) : (
              <div className="space-y-3">
                {assignedClients.slice(0, 5).map((client) => (
                  <div key={client.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 text-xs font-bold flex-shrink-0">
                      {(client.profile?.full_name ?? 'U')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                        {client.profile?.full_name ?? 'Unknown'}
                      </p>
                      <p className="text-xs text-zinc-400 truncate">
                        {client.total_orders} orders · {formatUGX(client.total_spent, true)}
                      </p>
                    </div>
                    {client.last_order_at && (
                      <span className="text-[11px] text-zinc-400 flex-shrink-0">
                        {timeAgo(client.last_order_at)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Recent Orders
              </h3>
              <a
                href="/distributor/orders"
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                View all →
              </a>
            </div>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-6">
                No orders yet
              </p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                          {order.client?.profile?.full_name ?? 'Unknown Client'}
                        </p>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {formatUGX(order.total_amount)} · {timeAgo(order.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
