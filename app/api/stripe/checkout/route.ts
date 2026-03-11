// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — STRIPE CHECKOUT API ROUTE
// app/api/stripe/checkout/route.ts
// Creates a Stripe Checkout session for subscription upgrade
// ═══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { STRIPE_PLANS } from '@/lib/stripe/config';
import type { SubscriptionPlan } from '@/types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as { plan: SubscriptionPlan };
    const { plan } = body;

    if (!plan || !STRIPE_PLANS[plan] || plan === 'free') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const planConfig = STRIPE_PLANS[plan];

    if (!planConfig.priceId) {
      return NextResponse.json({ error: 'Plan not configured' }, { status: 400 });
    }

    // Get or create Stripe customer
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('profile_id', user.id)
      .single();

    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/client/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/client/subscription?canceled=true`,
      metadata: {
        supabase_user_id: user.id,
        plan,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[Stripe Checkout] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
