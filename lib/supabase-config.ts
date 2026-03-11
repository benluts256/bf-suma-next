// ── Supabase Config & Shared Utilities ─────────────────────────────────────
import { createBrowserClient as _createBrowserClient } from "@supabase/ssr";

// Re-export centralized auth types and constants
export { ROLE_ROUTES } from "@/lib/auth";
export type { AppRole } from "@/lib/auth";

/**
 * Validates that required Supabase environment variables are set.
 * Throws a descriptive error if any are missing.
 */
export function validateEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      "Missing environment variable: NEXT_PUBLIC_SUPABASE_URL. " +
      "Please set it in your .env.local file or Vercel project settings."
    );
  }

  if (!anonKey) {
    throw new Error(
      "Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Please set it in your .env.local file or Vercel project settings."
    );
  }

  return { url, anonKey };
}

export function createBrowserClient() {
  const { url, anonKey } = validateEnv();
  return _createBrowserClient(url, anonKey);
}

/** Format a number as Ugandan Shillings */
export function formatUGX(amount: number, compact = false): string {
  if (compact) {
    if (amount >= 1_000_000) return `UGX ${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000)     return `UGX ${(amount / 1_000).toFixed(0)}K`;
  }
  return `UGX ${amount.toLocaleString("en-UG")}`;
}

// ── Product moderation RPCs (stubbed; replace with live Supabase calls) ─────
export async function approveProduct(productId: string, notes: string): Promise<void> {
  const supabase = createBrowserClient();
  const { error } = await supabase.rpc("approve_product", { product_id: productId, review_notes: notes });
  if (error) throw error;
}

export async function rejectProduct(productId: string, notes: string): Promise<void> {
  const supabase = createBrowserClient();
  const { error } = await supabase.rpc("reject_product", { product_id: productId, review_notes: notes });
  if (error) throw error;
}

export async function requestRevision(productId: string, notes: string): Promise<void> {
  const supabase = createBrowserClient();
  const { error } = await supabase.rpc("request_product_revision", { product_id: productId, review_notes: notes });
  if (error) throw error;
}

// ── Manager audit log ────────────────────────────────────────────────────────
export async function logShadowSession(distributorId: string): Promise<void> {
  const supabase = createBrowserClient();
  await supabase.from("manager_audit_log").insert({ action: "shadow_session", target_id: distributorId });
}
