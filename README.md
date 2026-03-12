# BF Suma Nexus — Production SaaS Platform

A production-grade SaaS platform for distributor and client management, built with Next.js 16, Supabase, and Stripe.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), TypeScript, TailwindCSS |
| Backend | Supabase (Auth, Database, Realtime) |
| Payments | Stripe (subscriptions, webhooks) |
| Deployment | Vercel |
| Charts | Recharts |

## Features

### Role-Based Access Control
- **Admin** — Full platform access, analytics, distributor management
- **Distributor** — Client management, order tracking, real-time messaging, GPS location
- **Client** — Order tracking, distributor communication, subscription management

### Admin Dashboard
- Revenue trend charts (30-day area chart)
- Order volume bar charts
- Real-time activity feed
- Distributor performance stats
- Client statistics

### Distributor System
- Assigned client list with order history
- Real-time messaging with clients
- GPS location tracking
- Commission tracking
- Rank system (Bronze → Silver → Gold → Platinum)

### Client Portal
- Order tracking with status updates
- Direct messaging with distributor
- Subscription management (Free/Pro/Enterprise)
- Wellness analytics

### Real-Time Features (Supabase Realtime)
- Live messaging between distributors and clients
- Real-time distributor location updates
- In-app notification system
- Activity feed updates

### Stripe Billing
| Plan | Price | Features |
|------|-------|---------|
| Free | $0/mo | 10 clients, basic analytics |
| Pro | $29/mo | 100 clients, advanced analytics, real-time |
| Enterprise | $99/mo | Unlimited, full suite, dedicated support |

## Project Structure

```
app/
├── admin/dashboard/     # Admin analytics dashboard
├── distributor/
│   ├── dashboard/       # Distributor overview
│   ├── messages/        # Real-time chat
│   └── location/        # GPS tracking
├── client/
│   ├── dashboard/       # Client overview
│   ├── orders/          # Order tracking
│   └── subscription/    # Stripe billing
├── auth/                # Login/signup
└── api/stripe/          # Checkout + webhook

lib/
├── supabase/            # Browser, server, middleware clients
├── auth/                # Config, helpers
├── stripe/              # Plan configuration
└── utils/               # Format, validation

services/                # Business logic (profiles, messages, activity)
hooks/                   # useAuth, useRealtime
types/                   # Shared TypeScript interfaces
components/
├── ui/                  # StatsCard, ActivityFeed, NotificationBell
├── dashboard/           # Sidebar, DashboardLayout
└── charts/              # RevenueTrendChart, OrdersBarChart
supabase/
└── schema.sql           # Full database schema with RLS
docs/
├── REPOSITORY_AUDIT.md  # Architecture audit
└── DEPLOYMENT.md        # Deployment guide
```

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase and Stripe credentials

# Run database schema
# Copy supabase/schema.sql → Supabase SQL Editor → Run

# Start development server
npm run dev
```

## Database Schema

Tables: `profiles`, `distributors`, `clients`, `messages`, `activity_logs`, `distributor_locations`, `subscriptions`, `notifications`, `orders`

All tables have:
- Row Level Security (RLS) enabled
- Proper indexes for performance
- Auto-updated `updated_at` timestamps
- Realtime enabled for key tables

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full deployment instructions.

## Environment Variables

See [.env.example](.env.example) for all required variables.

##   Securities

- Middleware-enforced role-based access control
- Supabase RLS policies on all tables
- Input validation and sanitization utilities
- Stripe webhook signature verification
- Service role key never exposed to client
- CSP headers configured in `next.config.ts`
