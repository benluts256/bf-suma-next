# BF Suma Nexus

A production-ready wellness supplements management platform built with Next.js 16, React 19, Supabase, and Capacitor for cross-platform deployment (Web, iOS, Android).

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4 |
| Auth & Database | Supabase (SSR + RLS) |
| Charts | Recharts (lazy-loaded) |
| Icons | Lucide React |
| Mobile | Capacitor 7 (iOS + Android) |
| PWA | Service Worker + Web Manifest |
| Deployment | Vercel (web), Xcode (iOS), Android Studio (Android) |

## 📁 Project Structure

```
bf-suma-next/
├── app/                    # Next.js App Router pages
│   ├── admin/              # Admin panel (manager role)
│   │   ├── dashboard/      # Admin dashboard with command center
│   │   ├── mfa/            # Multi-factor authentication setup
│   │   └── settings/       # Platform settings & configuration
│   ├── auth/               # Authentication (login/signup)
│   │   └── callback/       # OAuth callback handler
│   ├── client/             # Client dashboard
│   │   └── analytics/      # Wellness analytics
│   ├── distributor/        # Distributor dashboard
│   │   └── dashboard/      # Sales & team management
│   ├── marketing/          # Public marketing page
│   ├── offline/            # Offline fallback page
│   ├── tracking/           # Order tracking
│   └── packages/           # Supplement packages (TBD)
├── components/             # Reusable React components
│   ├── admin-charts.tsx    # Lazy-loaded chart components
│   ├── admin-command-center.tsx  # Admin command center
│   ├── admin-layout.tsx    # Responsive admin layout wrapper
│   ├── mobile-nav.tsx      # Mobile navigation (hamburger + bottom nav)
│   ├── navbar.tsx          # Top navigation bar
│   ├── nexusplatform.tsx   # Auth context provider
│   └── sidebar.tsx         # Desktop sidebar navigation
├── lib/                    # Utility libraries
│   ├── auth.ts             # Centralized auth helpers & role routes
│   ├── capacitor.ts        # Native platform detection
│   ├── supabase-config.ts  # Supabase client factory
│   └── supabaseServer.ts   # Server-side Supabase client
├── public/                 # Static assets
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # Service worker
│   └── icons/              # App icons (see README inside)
├── emails/                 # Email templates
├── store-metadata/         # App Store & Play Store listings
├── capacitor.config.ts     # Capacitor native config
├── middleware.ts           # Auth middleware with RBAC
└── next.config.ts          # Next.js configuration
```

## 🔐 Role-Based Access Control

| Role | Routes | Features |
|------|--------|----------|
| `manager` | `/admin/*` | Full admin panel, MFA required, settings, command center |
| `distributor` | `/distributor/*` | Sales dashboard, team management, tracking |
| `client` | `/client/*` | Wellness analytics, order tracking |

## 🏁 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase project (for auth & database)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd bf-suma-next

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📱 Mobile Deployment

### iOS (App Store)

```bash
# Build for Capacitor
npm run cap:build:ios

# This will:
# 1. Build Next.js as static export
# 2. Sync with Capacitor
# 3. Open Xcode

# In Xcode:
# 1. Set your signing team
# 2. Set bundle identifier: com.bfsuma.nexus
# 3. Archive and upload to App Store Connect
```

### Android (Play Store)

```bash
# Build for Capacitor
npm run cap:build:android

# This will:
# 1. Build Next.js as static export
# 2. Sync with Capacitor
# 3. Open Android Studio

# In Android Studio:
# 1. Build > Generate Signed Bundle/APK
# 2. Upload to Google Play Console
```

### PWA (Progressive Web App)

The app is also installable as a PWA directly from the browser. Users can "Add to Home Screen" for an app-like experience without going through app stores.

## 🛡️ Security Features

- **Server-side auth validation** using `supabase.auth.getUser()` (not `getSession()`)
- **Multi-factor authentication** (TOTP) for admin/manager role
- **Role-based middleware** protecting all routes
- **Content Security Policy** headers
- **CORS restrictions** (no wildcard origins)
- **Environment variable validation** with descriptive errors
- **Generic error messages** (no internal details exposed to users)

## 🎨 Responsive Design

- **Mobile-first** approach with Tailwind CSS breakpoints
- **Bottom navigation** for mobile users
- **Slide-out sidebar** with touch gestures
- **Dynamic viewport height** (`100dvh`) for mobile browser chrome
- **44px minimum touch targets** for all interactive elements
- **Safe area insets** for notched phones

## 📊 Performance Optimizations

- **Lazy-loaded charts** (Recharts loaded only when needed via `next/dynamic`)
- **Optimized fonts** via `next/font/google` (self-hosted, no render-blocking)
- **Memoized Supabase clients** (no re-creation on re-renders)
- **Service worker caching** (network-first with offline fallback)
- **Route-level code splitting** (automatic via Next.js App Router)

## 🧪 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production (Vercel) |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run cap:build` | Build static export + sync Capacitor |
| `npm run cap:build:ios` | Build + open in Xcode |
| `npm run cap:build:android` | Build + open in Android Studio |
| `npm run cap:sync` | Sync web assets to native projects |

## 📋 App Store Requirements Checklist

### Apple App Store
- [ ] App icons (all sizes in `public/icons/`)
- [ ] Screenshots (6.7", 6.5", 5.5" iPhone + iPad)
- [ ] Privacy policy URL
- [ ] App description & keywords (see `store-metadata/`)
- [ ] Age rating: 4+
- [ ] Category: Health & Fitness

### Google Play Store
- [ ] App icons (512x512 hi-res)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (phone + tablet)
- [ ] Privacy policy URL
- [ ] App description (see `store-metadata/`)
- [ ] Content rating: Everyone
- [ ] Category: Health & Fitness

## 📄 License

Proprietary — BF Suma Nexus. All rights reserved.
