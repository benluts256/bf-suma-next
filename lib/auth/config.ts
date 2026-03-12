// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — Auth Configuration
// lib/auth/config.ts
// Single source of truth for role routes and auth constants
// ═══════════════════════════════════════════════════════════════════════════════

import type { AppRole } from '@/types';

/** Role → default dashboard route mapping */
export const ROLE_ROUTES: Record<string, string> = {
  manager:     '/admin/dashboard',
  distributor: '/distributor/dashboard',
  client:      '/client/analytics',
};

/** Route prefix → required role mapping */
export const PROTECTED_PREFIXES: Record<string, string> = {
  '/admin':       'manager',
  '/distributor': 'distributor',
  '/client':      'client',
};

/** Public routes that don't require authentication */
export const PUBLIC_ROUTES = ['/auth', '/auth/callback', '/'];

/** Static asset patterns to skip in middleware */
export const STATIC_PATTERNS = [
  '/_next',
  '/api/public',
  '/favicon',
  /\.(png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|otf|css|js)$/,
];
