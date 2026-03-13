"use client";
// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — MAIN PLATFORM ENTRY & ROLE ROUTER
// File: components/nexusplatform.tsx
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient, ROLE_ROUTES, type AppRole } from "@/lib/supabase-config";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ── Context ───────────────────────────────────────────────────────────────────
interface NexusUser {
  id: string;
  email: string;
  role: AppRole;
  fullName: string;
  avatarInitials: string;
}

interface NexusContextValue {
  user: NexusUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  toast: (msg: string, type?: "success" | "error" | "info" | "warn") => void;
}

const NexusContext = createContext<NexusContextValue>({
  user: null,
  loading: true,
  signOut: async () => {},
  toast: () => {},
});

export function useNexus() {
  return useContext(NexusContext);
}

// ── Toast system ──────────────────────────────────────────────────────────────
interface Toast {
  id: string;
  msg: string;
  type: string;
}

// ── Provider (wraps children with NexusContext; manages auth state) ────────────
export function NexusProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<NexusUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const supabase = useMemo(() => createBrowserClient(), []);
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: { retry: 0 },
        },
      }),
    []
  );

  useEffect(() => {
    const init = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        setLoading(false);
        return;
      }

      // RLS: user_roles only returns caller's row
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("auth_user_id", authUser.id)
        .single();

      const profileResult = await supabase
        .from("distributor_profiles")
        .select("full_name")
        .eq("auth_user_id", authUser.id)
        .maybeSingle();

      const profile = profileResult?.data ?? null;

      const fullName =
        profile?.full_name ??
        (authUser.user_metadata as { full_name?: string } | null)?.full_name ??
        authUser.email ??
        "User";

      setUser({
        id: authUser.id,
        email: authUser.email ?? "",
        role: (roleRow?.role ?? "client") as AppRole,
        fullName,
        avatarInitials: fullName
          .split(" ")
          .map((w: string) => w[0])
          .slice(0, 2)
          .join("")
          .toUpperCase(),
      });
      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e: AuthChangeEvent, session: Session | null) => {
      if (!session) {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const toast = (msg: string, type = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(
      () => setToasts((t) => t.filter((x) => x.id !== id)),
      3500
    );
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <QueryClientProvider client={queryClient}>
      <NexusContext.Provider value={{ user, loading, signOut, toast }}>
        {children}
        {/* Toast layer */}
        <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} />
          ))}
        </div>
      </NexusContext.Provider>
    </QueryClientProvider>
  );
}

// ── Shell (standalone platform with routing) ──────────────────────────────────
export default function NexusPlatform() {
  const { user, loading } = useNexus();

  if (loading) return <NexusLoader />;
  if (!user) return <RedirectToAuth />;

  return (
    <div className="nexus-root font-['Outfit',sans-serif] bg-[#f8f9f6] min-h-screen">
      {/* Role-based router */}
      <NexusRouter role={user.role} />
    </div>
  );
}

// ── Router ────────────────────────────────────────────────────────────────────
function NexusRouter({ role }: { role: AppRole }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(ROLE_ROUTES[role]);
  }, [role, router]);

  return <NexusLoader label={`Loading ${role} portal…`} />;
}

// ── Loader ────────────────────────────────────────────────────────────────────
export function NexusLoader({ label = "Loading Nexus…" }: { label?: string }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0f2410]">
      {/* Animated hex logo */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-[#228B22] to-[#1a6b1a] flex items-center justify-center text-4xl shadow-[0_0_40px_rgba(34,139,34,0.5)] animate-pulse">
          ⬡
        </div>
        <div className="absolute inset-0 rounded-[22px] border-2 border-[#D4AF37]/30 animate-ping" />
      </div>
      <p className="font-['DM_Serif_Display',serif] text-2xl text-white mb-2">
        BF Suma Nexus
      </p>
      <p className="text-sm text-white/40 tracking-widest uppercase">{label}</p>
      {/* Scan line */}
      <div className="mt-8 w-48 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent animate-[shimmer_2s_linear_infinite]" />
    </div>
  );
}

function RedirectToAuth() {
  useEffect(() => {
    window.location.href = "/auth";
  }, []);
  return <NexusLoader label="Redirecting to sign in…" />;
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function ToastItem({ toast: t }: { toast: Toast }) {
  const styles: Record<string, string> = {
    success: "bg-[#228B22] text-white",
    error: "bg-red-600 text-white",
    warn: "bg-amber-500 text-white",
    info: "bg-blue-600 text-white",
  };
  const icons: Record<string, string> = {
    success: "✓",
    error: "✕",
    warn: "⚠",
    info: "ℹ",
  };
  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold min-w-[260px] ${styles[t.type] ?? styles.info} animate-[slideInRight_0.3s_cubic-bezier(0.16,1,0.3,1)_both]`}
    >
      <span className="text-base">{icons[t.type]}</span>
      {t.msg}
    </div>
  );
}

// ── Sidebar shell (shared by all portals) ─────────────────────────────────────
export function PortalShell({
  children,
  sidebar,
  theme = "light",
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  theme?: "light" | "dark";
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`flex h-screen overflow-hidden ${
        theme === "dark" ? "bg-[#040D06]" : "bg-[#f3f7f3]"
      }`}
    >
      {/* Sidebar */}
      <div
        className={`flex-shrink-0 transition-all duration-300 ${
          collapsed ? "w-[68px]" : "w-[240px]"
        } relative z-20`}
      >
        {sidebar}
        <button
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#228B22] text-white text-xs flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-30"
        >
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0">{children}</main>
    </div>
  );
}

// ── Shared UI primitives ──────────────────────────────────────────────────────
export function Avatar({
  name,
  size = 40,
  ring = false,
}: {
  name: string;
  size?: number;
  ring?: boolean;
}) {
  const colors = [
    "#228B22",
    "#1a6b1a",
    "#D4AF37",
    "#b8941f",
    "#2d7d2d",
    "#166616",
  ];
  const idx =
    name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={`avatar flex items-center justify-center font-bold text-white flex-shrink-0 ${
        ring ? "ring-2 ring-[#D4AF37] ring-offset-1" : ""
      }`}
      style={
        {
          "--avatar-size": `${size}px`,
          "--avatar-bg": colors[idx],
          "--avatar-font-size": `${size * 0.36}px`,
        } as React.CSSProperties
      }
    >
      {initials}
    </div>
  );
}

export function StatCard({
  icon,
  label,
  value,
  sub,
  trend,
  accent = "#228B22",
  dark = false,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  trend?: string;
  accent?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 relative overflow-hidden ${
        dark
          ? "bg-white/5 border border-white/10"
          : "bg-white border border-[#e8ede8] shadow-sm"
      }`}
    >
      <div
        className="absolute bottom-0 left-0 right-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
      />
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              trend.startsWith("+")
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-600"
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      <p
        className={`text-[11px] font-semibold tracking-wider uppercase mb-1 ${
          dark ? "text-white/40" : "text-zinc-400"
        }`}
      >
        {label}
      </p>
      <p
        className={`font-['JetBrains_Mono',monospace] font-bold text-xl leading-none ${
          dark ? "text-white" : "text-[#1a3a1a]"
        }`}
      >
        {value}
      </p>
      {sub && (
        <p className={`text-xs mt-1 ${dark ? "text-white/40" : "text-zinc-400"}`}>
          {sub}
        </p>
      )}
    </div>
  );
}

export function Badge({
  label,
  color = "green",
}: {
  label: string;
  color?: string;
}) {
  const cls: Record<string, string> = {
    green: "bg-green-100 text-green-800 border-green-200",
    gold: "bg-yellow-100 text-yellow-800 border-yellow-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    red: "bg-red-100 text-red-700 border-red-200",
    teal: "bg-teal-100 text-teal-800 border-teal-200",
    gray: "bg-zinc-100 text-zinc-600 border-zinc-200",
    dark: "bg-[#1a3a1a]/10 text-[#1a3a1a] border-[#1a3a1a]/20",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
        cls[color] ?? cls.gray
      }`}
    >
      {label}
    </span>
  );
}

export function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-white/70 border border-white/60 backdrop-blur-xl shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-label={checked ? "Toggle off" : "Toggle on"}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
        checked ? "bg-[#228B22] shadow-[0_0_12px_rgba(34,139,34,0.4)]" : "bg-zinc-300"
      }`}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
