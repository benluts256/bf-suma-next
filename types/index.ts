// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — Shared TypeScript Types
// types/index.ts
// ═══════════════════════════════════════════════════════════════════════════════

// ── Roles & Auth ──────────────────────────────────────────────────────────────

export type AppRole = 'admin' | 'distributor' | 'client';

export type SubscriptionPlan = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';

export type MessageType = 'text' | 'image' | 'system';

export type ActivityType =
  | 'login' | 'logout' | 'signup'
  | 'order_created' | 'order_updated' | 'order_completed'
  | 'client_assigned' | 'client_removed'
  | 'location_updated' | 'message_sent'
  | 'subscription_created' | 'subscription_updated' | 'subscription_canceled'
  | 'profile_updated' | 'settings_changed';

// ── Database Row Types ────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  auth_user_id: string;
  role: AppRole;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Distributor {
  id: string;
  profile_id: string;
  distributor_code: string;
  rank: string;
  rank_points: number;
  total_sales: number;
  commission_rate: number;
  region: string | null;
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  profile?: Profile;
}

export interface Client {
  id: string;
  profile_id: string;
  distributor_id: string | null;
  shipping_address: string | null;
  total_orders: number;
  total_spent: number;
  last_order_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  profile?: Profile;
  distributor?: Distributor;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: MessageType;
  is_read: boolean;
  read_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  // Joined fields
  sender?: Profile;
  receiver?: Profile;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  activity: ActivityType;
  description: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  // Joined fields
  user?: Profile;
}

export interface DistributorLocation {
  id: string;
  distributor_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  is_online: boolean;
  last_seen_at: string;
  created_at: string;
  // Joined fields
  distributor?: Distributor;
}

export interface Subscription {
  id: string;
  profile_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  action_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Order {
  id: string;
  client_id: string;
  distributor_id: string | null;
  status: string;
  total_amount: number;
  items_count: number;
  shipping_address: string | null;
  estimated_delivery: string | null;
  delivered_at: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined fields
  client?: Client;
  distributor?: Distributor;
}

// ── UI Types ──────────────────────────────────────────────────────────────────

export interface StatsCard {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: string;
}

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

// ── Stripe Types ──────────────────────────────────────────────────────────────

export interface PlanConfig {
  id: SubscriptionPlan;
  name: string;
  description: string;
  price: number;
  priceId: string;
  features: string[];
  limits: {
    clients: number;
    messages: number;
    analytics: boolean;
    realtime: boolean;
    priority_support: boolean;
  };
}

// ── API Response Types ────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
