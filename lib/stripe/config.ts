// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — Stripe Configuration
// lib/stripe/config.ts
// ═══════════════════════════════════════════════════════════════════════════════

import type { PlanConfig, SubscriptionPlan } from '@/types';

export const STRIPE_PLANS: Record<SubscriptionPlan, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Get started with basic features',
    price: 0,
    priceId: '', // No Stripe price for free
    features: [
      'Up to 10 clients',
      'Basic analytics',
      'Order tracking',
      'Email support',
    ],
    limits: {
      clients: 10,
      messages: 50,
      analytics: false,
      realtime: false,
      priority_support: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'For growing distributors',
    price: 29,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? '',
    features: [
      'Up to 100 clients',
      'Advanced analytics & charts',
      'Real-time location tracking',
      'Unlimited messaging',
      'Priority support',
    ],
    limits: {
      clients: 100,
      messages: -1, // unlimited
      analytics: true,
      realtime: true,
      priority_support: true,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large teams and organizations',
    price: 99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID ?? '',
    features: [
      'Unlimited clients',
      'Full analytics suite',
      'Real-time tracking & messaging',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee',
    ],
    limits: {
      clients: -1, // unlimited
      messages: -1,
      analytics: true,
      realtime: true,
      priority_support: true,
    },
  },
};

/**
 * Check if a feature is available for a given plan.
 */
export function hasFeature(
  plan: SubscriptionPlan,
  feature: keyof PlanConfig['limits']
): boolean {
  const config = STRIPE_PLANS[plan];
  const value = config.limits[feature];
  if (typeof value === 'boolean') return value;
  return value !== 0;
}

/**
 * Check if a plan limit has been reached.
 */
export function isWithinLimit(
  plan: SubscriptionPlan,
  feature: 'clients' | 'messages',
  currentCount: number
): boolean {
  const limit = STRIPE_PLANS[plan].limits[feature];
  if (limit === -1) return true; // unlimited
  return currentCount < limit;
}
