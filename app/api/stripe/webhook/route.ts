// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — STRIPE WEBHOOK HANDLER
// app/api/stripe/webhook/route.ts
// Handles Stripe subscription lifecycle events
// ═══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Create a Supabase client with service role for webhook operations
function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const plan = session.metadata?.plan;

        if (!userId || !plan) break;

        // Get the subscription from Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        ) as Stripe.Subscription;

        const periodStart = (stripeSubscription as unknown as { current_period_start: number }).current_period_start;
        const periodEnd = (stripeSubscription as unknown as { current_period_end: number }).current_period_end;

        // Update subscription in database
        await supabase
          .from('subscriptions')
          .update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: stripeSubscription.id,
            plan,
            status: stripeSubscription.status,
            current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
            current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          })
          .eq('profile_id', userId);

        // Log activity
        await supabase.from('activity_logs').insert({
          user_id: userId,
          activity: 'subscription_created',
          description: `Subscribed to ${plan} plan`,
          metadata: { plan, stripe_subscription_id: stripeSubscription.id },
        });

        // Send notification
        await supabase.from('notifications').insert({
          user_id: userId,
          title: 'Subscription Activated',
          body: `Your ${plan} plan is now active. Enjoy your new features!`,
          type: 'success',
        });

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (!userId) break;

        const periodStart = (subscription as unknown as { current_period_start: number }).current_period_start;
        const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;

        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            plan: subscription.metadata?.plan ?? 'free',
            current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
            current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq('stripe_subscription_id', subscription.id);

        await supabase.from('activity_logs').insert({
          user_id: userId,
          activity: 'subscription_updated',
          description: `Subscription updated to ${subscription.status}`,
        });

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (!userId) break;

        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            plan: 'free',
            canceled_at: new Date().toISOString(),
            stripe_subscription_id: null,
          })
          .eq('stripe_subscription_id', subscription.id);

        await supabase.from('activity_logs').insert({
          user_id: userId,
          activity: 'subscription_canceled',
          description: 'Subscription canceled, reverted to free plan',
        });

        await supabase.from('notifications').insert({
          user_id: userId,
          title: 'Subscription Canceled',
          body: 'Your subscription has been canceled. You are now on the free plan.',
          type: 'warning',
        });

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find user by Stripe customer ID
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('profile_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (sub?.profile_id) {
          await supabase
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_customer_id', customerId);

          await supabase.from('notifications').insert({
            user_id: sub.profile_id,
            title: 'Payment Failed',
            body: 'Your subscription payment failed. Please update your payment method.',
            type: 'error',
            action_url: '/client/subscription',
          });
        }

        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
