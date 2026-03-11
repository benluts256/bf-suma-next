'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — SUBSCRIPTION CLIENT COMPONENT
// app/client/subscription/client.tsx
// ═══════════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import {
  LayoutDashboard, Package, MessageSquare, BarChart3,
  CreditCard, Check, Zap, Building2, Loader2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { STRIPE_PLANS } from '@/lib/stripe/config';
import type { Profile, Subscription, SubscriptionPlan } from '@/types';

// ── Nav items ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/client/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/client/orders', label: 'My Orders', icon: <Package className="w-4 h-4" /> },
  { href: '/client/analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
  { href: '/client/messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4" /> },
  { href: '/client/subscription', label: 'Subscription', icon: <CreditCard className="w-4 h-4" /> },
];

// ── Plan icons ────────────────────────────────────────────────────────────────

const PLAN_ICONS: Record<SubscriptionPlan, React.ReactNode> = {
  free: <CreditCard className="w-5 h-5" />,
  pro: <Zap className="w-5 h-5" />,
  enterprise: <Building2 className="w-5 h-5" />,
};

const PLAN_COLORS: Record<SubscriptionPlan, string> = {
  free: 'border-zinc-200 dark:border-zinc-700',
  pro: 'border-emerald-500 ring-2 ring-emerald-500/20',
  enterprise: 'border-purple-500 ring-2 ring-purple-500/20',
};

const PLAN_BADGE_COLORS: Record<SubscriptionPlan, string> = {
  free: 'bg-zinc-100 text-zinc-600',
  pro: 'bg-emerald-100 text-emerald-700',
  enterprise: 'bg-purple-100 text-purple-700',
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface SubscriptionClientProps {
  profile: Profile;
  subscription: Subscription | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function SubscriptionClient({ profile, subscription }: SubscriptionClientProps) {
  const [loading, setLoading] = useState<SubscriptionPlan | null>(null);
  const currentPlan = subscription?.plan ?? 'free';

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    if (plan === 'free' || plan === currentPlan) return;

    setLoading(plan);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json() as { url?: string; error?: string };

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Checkout error:', data.error);
      }
    } catch (err) {
      console.error('Failed to create checkout session:', err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <DashboardLayout
      profile={profile}
      navItems={NAV_ITEMS}
      title="Subscription"
      brandLabel="Client Portal"
    >
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Current plan banner */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium">
                Current Plan
              </p>
              <div className="flex items-center gap-2 mt-1">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white capitalize">
                  {currentPlan}
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${PLAN_BADGE_COLORS[currentPlan]}`}>
                  {subscription?.status ?? 'active'}
                </span>
              </div>
            </div>
            {subscription?.current_period_end && currentPlan !== 'free' && (
              <div className="text-right">
                <p className="text-xs text-zinc-400">
                  {subscription.cancel_at_period_end ? 'Cancels' : 'Renews'}
                </p>
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Plans grid */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
            Available Plans
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(Object.values(STRIPE_PLANS) as typeof STRIPE_PLANS[SubscriptionPlan][]).map((plan) => {
              const isCurrentPlan = plan.id === currentPlan;
              const isLoading = loading === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`bg-white dark:bg-zinc-900 rounded-xl border p-5 flex flex-col ${PLAN_COLORS[plan.id]}`}
                >
                  {/* Plan header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      plan.id === 'pro' ? 'bg-emerald-100 text-emerald-600' :
                      plan.id === 'enterprise' ? 'bg-purple-100 text-purple-600' :
                      'bg-zinc-100 text-zinc-500'
                    }`}>
                      {PLAN_ICONS[plan.id]}
                    </div>
                    {plan.id === 'pro' && (
                      <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                        POPULAR
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-zinc-900 dark:text-white">
                    {plan.name}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5 mb-3">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-4">
                    {plan.price === 0 ? (
                      <p className="text-2xl font-bold text-zinc-900 dark:text-white">Free</p>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                          ${plan.price}
                        </span>
                        <span className="text-xs text-zinc-400">/month</span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 flex-1 mb-5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                        <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isCurrentPlan || isLoading || plan.id === 'free'}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      isCurrentPlan
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-default'
                        : plan.id === 'free'
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-default'
                        : plan.id === 'pro'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isCurrentPlan ? 'Current Plan' : plan.id === 'free' ? 'Free Forever' : `Upgrade to ${plan.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
