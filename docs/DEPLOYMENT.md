# BF Suma Nexus — Deployment Instructions

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account
- Vercel account (for deployment)

---

## 1. Supabase Setup

### 1.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **Anon Key** from Settings → API
3. Note your **Service Role Key** (keep this secret!)

### 1.2 Run the Database Schema

1. Open Supabase Dashboard → SQL Editor → New Query
2. Copy the contents of `supabase/schema.sql`
3. Run the query

This creates:
- `profiles` — unified user profiles
- `distributors` — distributor data
- `clients` — client data
- `messages` — real-time messaging
- `activity_logs` — activity tracking
- `distributor_locations` — GPS tracking
- `subscriptions` — Stripe billing
- `notifications` — in-app notifications
- `orders` — order management

### 1.3 Configure Auth

1. Go to Authentication → Settings
2. Set **Site URL** to your production URL
3. Add redirect URLs:
   - `https://your-domain.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (for development)
4. Enable Email provider

### 1.4 Enable Realtime

1. Go to Database → Replication
2. Enable replication for: `messages`, `notifications`, `distributor_locations`, `activity_logs`

---

## 2. Stripe Setup

### 2.1 Create Products

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Products
2. Create **Pro Plan**:
   - Name: "BF Suma Nexus Pro"
   - Price: $29/month (recurring)
   - Note the **Price ID** (starts with `price_`)
3. Create **Enterprise Plan**:
   - Name: "BF Suma Nexus Enterprise"
   - Price: $99/month (recurring)
   - Note the **Price ID**

### 2.2 Configure Webhooks

1. Go to Stripe Dashboard → Webhooks → Add endpoint
2. Endpoint URL: `https://your-domain.vercel.app/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Note the **Webhook Signing Secret** (starts with `whsec_`)

---

## 3. Local Development

### 3.1 Clone and Install

```bash
git clone https://github.com/benluts256/bf-suma-next
cd bf-suma-next
npm install
```

### 3.2 Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_SITE_URL=http://localhost:3000

STRIPE_SECRET_KEY=sk_test_your-test-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_your-pro-price-id
NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID=price_your-enterprise-price-id
```

### 3.3 Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 3.4 Test Stripe Webhooks Locally

Install Stripe CLI:
```bash
# Windows (via scoop)
scoop install stripe

# macOS
brew install stripe/stripe-cli/stripe
```

Forward webhooks to local server:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## 4. Vercel Deployment

### 4.1 Connect Repository

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repository
3. Framework: Next.js (auto-detected)

### 4.2 Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.vercel.app` |
| `STRIPE_SECRET_KEY` | Your Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Your Stripe webhook secret |
| `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` | Pro plan price ID |
| `NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID` | Enterprise plan price ID |

### 4.3 Deploy

```bash
# Deploy via CLI
npx vercel --prod

# Or push to main branch (auto-deploys if connected)
git push origin main
```

### 4.4 Update Stripe Webhook URL

After deployment, update your Stripe webhook endpoint URL to:
`https://your-actual-domain.vercel.app/api/stripe/webhook`

---

## 5. Post-Deployment Checklist

- [ ] Database schema applied in Supabase
- [ ] RLS policies enabled on all tables
- [ ] Realtime enabled for messages, notifications, locations
- [ ] Auth redirect URLs configured in Supabase
- [ ] Stripe products and prices created
- [ ] Stripe webhook configured with correct URL
- [ ] All environment variables set in Vercel
- [ ] Test user signup flow (distributor + client)
- [ ] Test Stripe checkout flow
- [ ] Test real-time messaging
- [ ] Verify role-based access control

---

## 6. Creating the First Admin User

After deployment, create an admin user manually:

1. Sign up normally at `/auth`
2. In Supabase Dashboard → Table Editor → `profiles`
3. Find your user and change `role` to `admin`

Or run this SQL:
```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-admin@email.com';
```

---

## 7. Architecture Overview

```
app/
├── admin/          # Admin-only routes (role: admin)
│   ├── dashboard/  # Analytics, stats, activity
│   ├── distributors/
│   ├── clients/
│   └── settings/
├── distributor/    # Distributor routes (role: distributor)
│   ├── dashboard/
│   ├── clients/
│   ├── orders/
│   ├── messages/   # Real-time chat
│   └── location/   # GPS tracking
├── client/         # Client routes (role: client)
│   ├── dashboard/
│   ├── orders/
│   ├── analytics/
│   ├── messages/
│   └── subscription/ # Stripe billing
├── auth/           # Authentication
│   ├── page.tsx    # Login/signup
│   └── callback/   # OAuth callback
└── api/
    └── stripe/
        ├── checkout/ # Create checkout session
        └── webhook/  # Handle Stripe events

lib/
├── supabase/       # Supabase clients (browser, server, middleware)
├── auth/           # Auth config and helpers
├── stripe/         # Stripe configuration
└── utils/          # Formatting, validation

services/           # Business logic layer
hooks/              # React hooks (auth, realtime)
types/              # TypeScript interfaces
components/
├── ui/             # Reusable UI components
├── dashboard/      # Dashboard layout, sidebar
└── charts/         # Recharts wrappers
```
