'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — CLIENT DASHBOARD CLIENT COMPONENT
// app/client/dashboard/client.tsx
// ═══════════════════════════════════════════════════════════════════════════════

import {
  LayoutDashboard, Package, MessageSquare, BarChart3,
  CreditCard, ShoppingBag, Truck, CheckCircle, Clock, XCircle,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { StatsCard } from '@/components/ui/stats-card';
import { formatUGX, timeAgo } from '@/lib/utils/format';
import type { Profile } from '@/types';

// ── Nav items ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/client/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/client/orders', label: 'My Orders', icon: <Package className="w-4 h-4" /> },
  { href: '/client/analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
  { href: '/client/messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4" /> },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface ClientRecord {
  id: string;
  total_orders: number;
  total_spent: number;
  last_order_at?: string;
  distributor?: {
    distributor_code: string;
    rank: string;
    profile?: {
      full_name: string;
      email: string;
    };
  };
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  items_count: number;
  created_at: string;
  estimated_delivery?: string;
}

interface ClientDashboardClientProps {
  profile: Profile;
  clientRecord: ClientRecord | null;
  recentOrders: Order[];
}

// ── Order status icon ─────────────────────────────────────────────────────────

function OrderStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'delivered':
      return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    case 'shipped':
      return <Truck className="w-4 h-4 text-blue-500" />;
    case 'canceled':
      return <XCircle className="w-4 h-4 text-red-500" />;
    default:
      return <Clock className="w-4 h-4 text-yellow-500" />;
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function ClientDashboardClient({
  profile,
  clientRecord,
  recentOrders,
}: ClientDashboardClientProps) {
  return (
    <DashboardLayout
      profile={profile}
      navItems={NAV_ITEMS}
      title="My Dashboard"
      brandLabel="Client Portal"
    >
      <div className="p-6 space-y-6">
        {/* Welcome banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Welcome back,</p>
              <h2 className="text-xl font-bold mt-0.5">{profile.full_name}</h2>
              {clientRecord?.distributor && (
                <p className="text-sm text-emerald-100 mt-1">
                  Your distributor: <span className="font-semibold">{clientRecord.distributor.profile?.full_name}</span>
                </p>
              )}
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                Active Client
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            title="Total Orders"
            value={clientRecord?.total_orders ?? 0}
            icon={<ShoppingBag className="w-5 h-5" />}
          />
          <StatsCard
            title="Total Spent"
            value={formatUGX(clientRecord?.total_spent ?? 0, true)}
            icon={<CreditCard className="w-5 h-5" />}
          />
          <StatsCard
            title="Last Order"
            value={clientRecord?.last_order_at ? timeAgo(clientRecord.last_order_at) : 'Never'}
            icon={<Package className="w-5 h-5" />}
          />
        </div>

        {/* Recent Orders */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Recent Orders
            </h3>
            <a
              href="/client/orders"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              View all →
            </a>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">No orders yet</p>
              <p className="text-xs text-zinc-300 mt-1">
                Contact your distributor to place an order
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50"
                >
                  <OrderStatusIcon status={order.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 capitalize">
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {order.items_count} item{order.items_count !== 1 ? 's' : ''} ·{' '}
                      {formatUGX(order.total_amount)} · {timeAgo(order.created_at)}
                    </p>
                  </div>
                  {order.estimated_delivery && order.status !== 'delivered' && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] text-zinc-400">Est. delivery</p>
                      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                        {new Date(order.estimated_delivery).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
