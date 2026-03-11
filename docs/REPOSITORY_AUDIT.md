# BF Suma Nexus — Repository Audit

## 1. Architecture Issues

### Current State
- **Monolithic components**: `admin-command-center.tsx` is 32KB — a single component handling all admin functionality
- **No service layer**: Database queries are scattered across page components and middleware
- **No API routes**: All data fetching happens in server components or client-side directly
- **Mixed concerns**: `supabase-config.ts` contains auth re-exports, currency formatting, product RPCs, and audit logging
- **No hooks directory**: Custom hooks are embedded in components (`nexusplatform.tsx`)
- **No types directory**: Types are defined inline in each file
- **Capacitor coupling**: Mobile app build config is mixed into the web platform

### Structural Problems
- `lib/supabaseClient.ts` exists but is unused (dead code)
- Junk files at root: `0){console.log(Found these invalid buttons` and `setSessions(1)')` 
- No `services/` layer for business logic
- No `hooks/` directory for reusable React hooks
- No `types/` directory for shared TypeScript interfaces

## 2. Missing SaaS Features

| Feature | Status |
|---------|--------|
| Subscription billing (Stripe) | ❌ Missing |
| Feature gating by plan | ❌ Missing |
| Multi-tenant isolation | ❌ Missing |
| Real-time messaging | ❌ Missing |
| Real-time location tracking | ❌ Missing |
| Activity logging | ❌ Missing |
| Notification system | ❌ Missing |
| Admin analytics dashboard | ⚠️ Partial (mock data) |
| Distributor client management | ⚠️ Partial (placeholder) |
| Client order tracking | ⚠️ Partial (basic) |
| Email templates | ⚠️ Basic (1 HTML file) |
| API rate limiting | ❌ Missing |
| Webhook handling | ❌ Missing |

## 3. Security Risks

| Risk | Severity | Details |
|------|----------|---------|
| No input validation/sanitization | HIGH | Form inputs go directly to Supabase |
| No CSRF protection on API routes | HIGH | No API routes exist yet |
| RLS policies unknown | HIGH | No SQL schema in repo to verify |
| Service role key exposure risk | MEDIUM | Only anon key used, but no server-side validation layer |
| No rate limiting | MEDIUM | Auth endpoints vulnerable to brute force |
| MFA window too long (8hrs) | LOW | Could be reduced for higher security |
| CSP allows unsafe-inline | LOW | Required for Next.js but could be tightened |

## 4. Database Improvements Needed

### Current Tables (inferred from code)
- `user_roles` — basic role assignment
- `manager_profiles` — admin/manager data
- `distributor_profiles` — distributor data
- `clients` — client data
- `orders` — order tracking
- `manager_audit_log` — basic audit

### Missing Tables
- `profiles` — unified user profiles
- `messages` — real-time messaging
- `activity_logs` — comprehensive activity tracking
- `distributor_locations` — GPS tracking
- `subscriptions` — Stripe subscription data
- `subscription_plans` — plan definitions
- `notifications` — in-app notifications
- `distributor_clients` — assignment junction table

### Missing Database Features
- No indexes defined
- No foreign key constraints visible
- No RLS policies in codebase
- No database functions/triggers
- No real-time subscriptions configured
