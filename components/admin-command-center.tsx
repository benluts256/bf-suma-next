"use client";
// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — ADMIN COMMAND CENTER (Manager Portal)
// File: components/admin-command-center.tsx
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import {
  createBrowserClient, formatUGX,
  approveProduct, rejectProduct, requestRevision, logShadowSession,
} from "@/lib/supabase-config";
import { Avatar } from "@/components/nexusplatform";
import MobileNav from "@/components/mobile-nav";

// Lazy-load chart components to keep recharts (~200KB+) out of the main bundle
const SalesTrendChart = dynamic(() => import("@/components/admin-charts").then(mod => ({ default: mod.SalesTrendChart })), { ssr: false, loading: () => <div className="h-[200px] animate-pulse bg-white/[0.04] rounded-xl" /> });
const ProductMixChart = dynamic(() => import("@/components/admin-charts").then(mod => ({ default: mod.ProductMixChart })), { ssr: false, loading: () => <div className="h-[130px] animate-pulse bg-white/[0.04] rounded-xl" /> });
const OrderVolumeChart = dynamic(() => import("@/components/admin-charts").then(mod => ({ default: mod.OrderVolumeChart })), { ssr: false, loading: () => <div className="h-[200px] animate-pulse bg-white/[0.04] rounded-xl" /> });
const RevenueCommissionChart = dynamic(() => import("@/components/admin-charts").then(mod => ({ default: mod.RevenueCommissionChart })), { ssr: false, loading: () => <div className="h-[200px] animate-pulse bg-white/[0.04] rounded-xl" /> });

// ── Types ─────────────────────────────────────────────────────────────────────
interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  accessLevel: string;
}

interface AdminCommandCenterProps {
  user: AdminUser;
}

type MgrTab = "overview" | "analytics" | "leaderboard" | "audit" | "products" | "hub";

// ── Mock data (replace with live Supabase queries in production) ──────────────
const SALES_TREND = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - 29 + i);
  return {
    date: d.toLocaleDateString("en-UG", { month: "short", day: "numeric" }),
    ugx: Math.round(1_800_000 + Math.sin(i / 3) * 400_000 + Math.random() * 300_000),
    orders: Math.round(18 + Math.sin(i / 4) * 6 + Math.random() * 4),
  };
});

const LEADERBOARD = [
  { id: "1", full_name: "Grace Nantume",  rank: "Gold",     rank_points: 1850, total_sales_ugx: 8_540_000,  commission_ugx: 1_281_000, client_count: 12, order_count: 87,  sales_30d_ugx: 2_100_000, position: 1, email: "grace@nexus.ug" },
  { id: "2", full_name: "Moses Kiggundu", rank: "Platinum", rank_points: 3200, total_sales_ugx: 14_200_000, commission_ugx: 2_130_000, client_count: 24, order_count: 156, sales_30d_ugx: 3_800_000, position: 2, email: "moses@nexus.ug" },
  { id: "3", full_name: "Samuel Mwangi",  rank: "Diamond",  rank_points: 5100, total_sales_ugx: 22_600_000, commission_ugx: 3_390_000, client_count: 38, order_count: 224, sales_30d_ugx: 5_200_000, position: 3, email: "samuel@nexus.ug" },
  { id: "4", full_name: "Aisha Nalwoga",  rank: "Silver",   rank_points: 620,  total_sales_ugx: 3_100_000,  commission_ugx: 465_000,   client_count: 6,  order_count: 42,  sales_30d_ugx: 820_000,   position: 4, email: "aisha@nexus.ug" },
  { id: "5", full_name: "David Ssemanda", rank: "Gold",     rank_points: 1620, total_sales_ugx: 7_400_000,  commission_ugx: 1_110_000, client_count: 11, order_count: 74,  sales_30d_ugx: 1_800_000, position: 5, email: "david@nexus.ug" },
];

const PENDING_PRODUCTS = [
  { id: "p1", name: "Moringa Power Blend", tagline: "Premium Ugandan Moringa for daily vitality", category: "Immunity", price_ugx: 85_000, emoji: "🌿", benefits: ["Antioxidant", "Iron boost", "Energy"],       description: "Cold-pressed Moringa from organic Ugandan farms, standardized to 20% chlorophyll.", distributor_name: "Grace Nantume",  revision_count: 0, submitted_for_review_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "p2", name: "Baobab Vitamin C",    tagline: "African superfruit immunity shield",          category: "Immunity", price_ugx: 72_000, emoji: "🍊", benefits: ["Vitamin C", "Collagen", "Immunity"], description: "Wild-harvested Ugandan baobab powder with naturally occurring Vitamin C.",        distributor_name: "Moses Kiggundu", revision_count: 1, submitted_for_review_at: new Date(Date.now() - 86400000 * 1).toISOString() },
];

const PIE_DATA = [
  { name: "NMN 4500",  value: 28, color: "#228B22" },
  { name: "Cordyceps", value: 22, color: "#D4AF37" },
  { name: "Probiotic", value: 18, color: "#2d9d2d" },
  { name: "Omega-3",   value: 14, color: "#b8941f" },
  { name: "Others",    value: 18, color: "#64748b" },
];

const RANK_COLORS: Record<string, string> = {
  Silver:   "text-zinc-500 bg-zinc-100",
  Gold:     "text-yellow-700 bg-yellow-100",
  Platinum: "text-blue-700 bg-blue-100",
  Diamond:  "text-teal-700 bg-teal-100",
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminCommandCenter({ user }: AdminCommandCenterProps) {
  const pathname = usePathname();
  const [tab, setTab]             = useState<MgrTab>("overview");
  const [shadowDist, setShadow]   = useState<typeof LEADERBOARD[0] | null>(null);
  const [pending, setPending]     = useState(PENDING_PRODUCTS);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [notes, setNotes]         = useState("");
  const [loading, setLoading]     = useState<Record<string, boolean>>({});

  const handleShadow = async (dist: typeof LEADERBOARD[0]) => {
    await logShadowSession(dist.id);
    setShadow(dist);
    setTab("audit");
  };

  const handleModerate = async (action: "approve" | "reject" | "revision", productId: string) => {
    setLoading((l) => ({ ...l, [productId]: true }));
    try {
      if (action === "approve")       await approveProduct(productId, notes);
      else if (action === "reject")   await rejectProduct(productId, notes);
      else                            await requestRevision(productId, notes);
      setPending((p) => p.filter((x) => x.id !== productId));
      setReviewing(null);
      setNotes("");
    } catch (e: unknown) {
      alert("Error: " + (e instanceof Error ? e.message : String(e)));
    }
    setLoading((l) => ({ ...l, [productId]: false }));
  };

  const TABS: [MgrTab, string, string][] = [
    ["overview",    "⬢", "Overview"],
    ["analytics",   "📈", "Analytics"],
    ["leaderboard", "🏆", "Leaderboard"],
    ["audit",       "🔍", "Distributor Audit"],
    ["products",    "📦", "Products"],
    ["hub",         "📍", "Hub Analytics"],
  ];

  return (
    <div className="flex h-[100dvh] overflow-hidden font-['Outfit',sans-serif] bg-[#040D06]">
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scanLine{0%,100%{transform:translateY(-100%)}50%{transform:translateY(100%)}}
        .stat-scan::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent,rgba(212,175,55,0.04),transparent);animation:scanLine 3s ease-in-out infinite;pointer-events:none}
      `}</style>

      {/* ── MOBILE NAV (visible on mobile only) ── */}
      <MobileNav role="admin" currentPath={pathname} />

      {/* ── SIDEBAR (hidden on mobile) ── */}
      <aside className="hidden md:flex md:w-[230px] flex-shrink-0 flex-col border-r border-white/[0.06] bg-[#081208]">
        {/* Logo */}
        <div className="p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5 mb-0.5">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#228B22] to-[#1a6b1a] flex items-center justify-center text-base shadow-[0_4px_18px_rgba(34,139,34,0.4)]">
              ⬡
            </div>
            <div>
              <p className="font-['DM_Serif_Display',serif] text-[17px] text-white leading-none">BF Suma</p>
              <p className="text-[8.5px] tracking-[0.18em] text-[#D4AF37] uppercase font-bold">Command Center</p>
            </div>
          </div>
        </div>

        {/* Manager ID */}
        <div className="px-4 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.04]">
            <Avatar name={user.fullName} size={36} ring />
            <div className="min-w-0">
              <p className="text-white text-[12.5px] font-semibold truncate">{user.fullName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#228B22] animate-pulse" />
                <span className="text-[10px] text-[#D4AF37] font-medium">MFA Active · {user.accessLevel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shadow banner */}
        {shadowDist && (
          <div className="mx-3 mt-3 px-3 py-2.5 rounded-xl border border-amber-500/30 text-amber-400 bg-amber-500/[0.08]">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1">Shadow Mode</p>
            <p className="text-[11.5px] font-semibold truncate">{shadowDist.full_name}</p>
            <button
              type="button"
              onClick={() => setShadow(null)}
              className="text-[10px] text-amber-400/60 hover:text-amber-400 mt-1"
            >
              Exit shadow →
            </button>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {TABS.map(([t, icon, label]) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                tab === t
                  ? "bg-[#228B22]/20 text-[#228B22] border border-[#228B22]/20"
                  : "text-white/45 hover:text-white/70 hover:bg-white/[0.04]"
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
              {t === "products" && pending.length > 0 && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold">
                  {pending.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Sign out */}
        <div className="p-3 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={() => {
              const s = createBrowserClient();
              s.auth.signOut().then(() => { window.location.href = "/auth"; });
            }}
            className="w-full py-2 text-[12px] text-white/30 hover:text-white/60 transition-colors font-medium"
          >
            Sign out →
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 overflow-y-auto min-w-0 p-4 md:p-8 pb-20 md:pb-8 [animation:fadeUp_0.4s_cubic-bezier(0.16,1,0.3,1)_both]">

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="space-y-8">
            <div>
              <h1 className="font-['DM_Serif_Display',serif] text-3xl text-white mb-1">Command Center</h1>
              <p className="text-white/40 text-sm">Network overview · Uganda Distribution Network</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[
                { icon: "💰", label: "Network Sales",     value: formatUGX(59_600_000, true), trend: "+14%", sub: "All distributors · 30d" },
                { icon: "🌿", label: "Distributors",       value: "6",                          trend: "+8%",  sub: "2 new this month" },
                { icon: "👥", label: "Total Clients",      value: "95",                         trend: "+12%", sub: "Across network" },
                { icon: "💎", label: "Commission Pool",    value: formatUGX(8_940_000, true),  trend: "+12%", sub: "15% of network sales" },
                { icon: "📦", label: "Pending Orders",     value: "8",                          trend: undefined, sub: "Across all distributors" },
                { icon: "⏳", label: "Awaiting Approval",  value: String(pending.length),       trend: undefined, sub: "Custom products", accent: "#D4AF37" },
              ].map((c, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-5 relative overflow-hidden border border-white/[0.07] stat-scan bg-white/[0.04]"
                >
                  {/* accent bar — data-driven colour via CSS variable */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[2px] [background:linear-gradient(90deg,var(--accent-color),transparent)]"
                    style={{ "--accent-color": c.accent ?? "#228B22" } as React.CSSProperties}
                  />
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl">{c.icon}</span>
                    {c.trend && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">
                        {c.trend}
                      </span>
                    )}
                  </div>
                  <p className="text-[10.5px] font-bold tracking-widest uppercase text-white/35 mb-1">{c.label}</p>
                  <p className="font-['JetBrains_Mono',monospace] font-bold text-xl text-white">{c.value}</p>
                  <p className="text-[11px] text-white/30 mt-1">{c.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sales trend */}
              <div className="lg:col-span-2 rounded-2xl p-4 md:p-6 border border-white/[0.07] bg-white/[0.04]">
                <p className="text-white font-semibold mb-1">30-Day Network Sales</p>
                <p className="text-white/30 text-xs mb-5">Daily UGX revenue across all distributors</p>
                <SalesTrendChart data={SALES_TREND} />
              </div>
              {/* Product mix */}
              <div className="rounded-2xl p-4 md:p-6 border border-white/[0.07] bg-white/[0.04]">
                <p className="text-white font-semibold mb-5">Product Mix</p>
                <ProductMixChart data={PIE_DATA} />
                <div className="space-y-2 mt-3">
                  {PIE_DATA.map((e) => (
                    <div key={e.name} className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 [background:var(--dot-color)]"
                        style={{ "--dot-color": e.color } as React.CSSProperties}
                      />
                      <span className="text-white/50 text-[11px] flex-1">{e.name}</span>
                      <span className="text-white font-bold text-[11px] font-mono">{e.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LEADERBOARD */}
        {tab === "leaderboard" && (
          <div className="space-y-8">
            <div>
              <h1 className="font-['DM_Serif_Display',serif] text-3xl text-white mb-1">Network Leaderboard</h1>
              <p className="text-white/40 text-sm">All-time distributor performance · UGX</p>
            </div>
            {/* Podium top 3 */}
            <div className="flex items-end justify-center gap-3 md:gap-4 overflow-x-auto px-2">
              {[LEADERBOARD[1], LEADERBOARD[0], LEADERBOARD[2]].map((d, pi) => {
                const heights = ["h-28", "h-36", "h-24"];
                const medals  = pi === 1 ? "🥇" : pi === 0 ? "🥈" : "🥉";
                const podiumBg =
                  pi === 1 ? "linear-gradient(180deg,rgba(212,175,55,0.3),rgba(212,175,55,0.1))"
                  : pi === 0 ? "linear-gradient(180deg,rgba(148,163,184,0.2),rgba(148,163,184,0.05))"
                  : "linear-gradient(180deg,rgba(180,120,60,0.2),rgba(180,120,60,0.05))";
                return (
                  <div key={d.id} className="flex flex-col items-center gap-3">
                    <Avatar name={d.full_name} size={pi === 1 ? 54 : 44} ring />
                    <div className="text-center">
                      <p className="text-white text-[12.5px] font-semibold">{d.full_name.split(" ")[0]}</p>
                      <p className="text-[#D4AF37] text-xs font-mono">{formatUGX(d.total_sales_ugx, true)}</p>
                    </div>
                    <div
                      className={`w-24 ${heights[pi]} rounded-t-xl flex items-center justify-center text-2xl border border-white/10 [background:var(--podium-bg)]`}
                      style={{ "--podium-bg": podiumBg } as React.CSSProperties}
                    >
                      {medals}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Table */}
            <div className="rounded-2xl border border-white/[0.07] overflow-hidden bg-white/[0.03] overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {["#", "Distributor", "Rank", "All-time Sales", "30d Sales", "Clients", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white/30">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {LEADERBOARD.map((d) => (
                    <tr key={d.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-3 text-white/40 font-mono text-sm">#{d.position}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={d.full_name} size={32} />
                          <div>
                            <p className="text-white text-[13px] font-semibold">{d.full_name}</p>
                            <p className="text-white/30 text-[11px]">{d.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${RANK_COLORS[d.rank]}`}>{d.rank}</span>
                      </td>
                      <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-[#228B22] text-sm font-bold">{formatUGX(d.total_sales_ugx, true)}</td>
                      <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-white/60 text-sm">{formatUGX(d.sales_30d_ugx, true)}</td>
                      <td className="px-4 py-3 text-white/60 text-sm">{d.client_count}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleShadow(d)}
                          className="text-[11.5px] font-semibold px-3 py-1.5 rounded-lg text-amber-400 border border-amber-400/30 hover:bg-amber-400/10 transition-colors"
                        >
                          👁 Shadow
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DISTRIBUTOR AUDIT */}
        {tab === "audit" && (
          <div className="space-y-6">
            <div>
              <h1 className="font-['DM_Serif_Display',serif] text-3xl text-white mb-1">Distributor Audit</h1>
              {shadowDist && (
                <div className="flex items-center gap-2 mt-2 px-4 py-2 rounded-xl border border-amber-500/30 text-amber-400 text-sm w-fit bg-amber-500/[0.08]">
                  👁 Shadow Mode: <strong className="ml-1">{shadowDist.full_name}</strong> — Read Only
                  <button type="button" onClick={() => setShadow(null)} className="ml-3 text-xs opacity-60 hover:opacity-100">Exit</button>
                </div>
              )}
            </div>
            {shadowDist ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  ["💰", "Total Sales",  formatUGX(shadowDist.total_sales_ugx, true)],
                  ["💎", "Commission",   formatUGX(shadowDist.commission_ugx, true)],
                  ["👥", "Clients",      String(shadowDist.client_count)],
                  ["📦", "Orders",       String(shadowDist.order_count)],
                  ["⭐", "Rank Points",  String(shadowDist.rank_points)],
                  ["📈", "30d Sales",    formatUGX(shadowDist.sales_30d_ugx, true)],
                ].map(([icon, lbl, val]) => (
                  <div key={lbl} className="rounded-2xl p-5 border border-white/[0.07] bg-white/[0.04]">
                    <span className="text-2xl mb-2 block">{icon}</span>
                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/35 mb-1">{lbl}</p>
                    <p className="font-['JetBrains_Mono',monospace] font-bold text-lg text-white">{val}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {LEADERBOARD.map((d) => (
                  <div key={d.id} className="rounded-2xl p-5 border border-white/[0.07] flex items-center gap-4 bg-white/[0.04]">
                    <Avatar name={d.full_name} size={44} ring />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">{d.full_name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${RANK_COLORS[d.rank]}`}>{d.rank}</span>
                      <p className="text-[#228B22] text-xs font-mono mt-1">{formatUGX(d.total_sales_ugx, true)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleShadow(d)}
                      className="text-[11px] font-bold px-3 py-1.5 rounded-lg text-amber-400 border border-amber-400/30 hover:bg-amber-400/10 transition-colors"
                    >
                      Shadow
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PRODUCT MODERATION */}
        {tab === "products" && (
          <div className="space-y-6">
            <div>
              <h1 className="font-['DM_Serif_Display',serif] text-3xl text-white mb-1">Product Moderation</h1>
              <p className="text-white/40 text-sm">{pending.length} product{pending.length !== 1 ? "s" : ""} awaiting review</p>
            </div>
            {/* Compliance banner */}
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-[#D4AF37]/20 text-[#D4AF37]/80 text-[12px] bg-[#D4AF37]/[0.06]">
              <span className="text-base">⚖️</span>
              <span>Checklist: Ingredients disclosed · Price aligned · No false claims · Category correct · Benefits evidence-based</span>
            </div>
            {pending.length === 0 ? (
              <div className="rounded-2xl p-12 text-center border border-white/[0.07] bg-white/[0.03]">
                <p className="text-4xl mb-4">✅</p>
                <p className="text-white font-semibold mb-1">All products reviewed!</p>
                <p className="text-white/30 text-sm">No pending approvals.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pending.map((p) => (
                  <div key={p.id} className="rounded-2xl border border-white/[0.07] overflow-hidden bg-white/[0.04]">
                    <div className="p-5 flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-3xl flex-shrink-0">{p.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-semibold text-base">{p.name}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-bold">Pending</span>
                          {p.revision_count > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 font-bold">
                              Rev #{p.revision_count}
                            </span>
                          )}
                        </div>
                        <p className="text-white/50 text-sm mb-2">{p.tagline}</p>
                        <div className="flex items-center gap-3 text-xs text-white/30">
                          <span>By: <span className="text-white/60 font-semibold">{p.distributor_name}</span></span>
                          <span>·</span>
                          <span className="font-mono text-[#D4AF37]">{formatUGX(p.price_ugx)}</span>
                          <span>·</span>
                          <span>{p.category}</span>
                        </div>
                        <p className="text-white/40 text-xs mt-2 leading-relaxed">{p.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {p.benefits.map((b) => (
                            <span key={b} className="text-[10px] px-2 py-0.5 rounded-full bg-[#228B22]/15 text-[#228B22]">{b}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {reviewing === p.id ? (
                      <div className="border-t border-white/[0.06] p-5 space-y-3">
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Review notes (optional)"
                          rows={2}
                          className="w-full rounded-xl bg-white/[0.06] border border-white/10 text-white/80 text-sm px-4 py-3 outline-none focus:border-[#228B22]/50 resize-none"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button type="button" disabled={loading[p.id]} onClick={() => handleModerate("approve",  p.id)} className="flex-1 min-w-[100px] h-11 rounded-xl bg-[#228B22] text-white font-bold text-sm hover:bg-[#1a6b1a] transition-colors disabled:opacity-60">✓ Approve</button>
                          <button type="button" disabled={loading[p.id]} onClick={() => handleModerate("revision", p.id)} className="flex-1 min-w-[100px] h-11 rounded-xl bg-amber-500/20 text-amber-400 font-bold text-sm hover:bg-amber-500/30 transition-colors disabled:opacity-60">📝 Revision</button>
                          <button type="button" disabled={loading[p.id]} onClick={() => handleModerate("reject",   p.id)} className="flex-1 min-w-[100px] h-11 rounded-xl bg-red-500/20 text-red-400 font-bold text-sm hover:bg-red-500/30 transition-colors disabled:opacity-60">✕ Reject</button>
                          <button type="button" onClick={() => { setReviewing(null); setNotes(""); }} className="h-11 px-4 rounded-xl text-white/30 hover:text-white/60 text-sm transition-colors">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-t border-white/[0.06] px-5 py-3">
                        <button type="button" onClick={() => setReviewing(p.id)} className="text-[12px] font-semibold text-[#228B22] hover:text-[#D4AF37] transition-colors">
                          Review Product →
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ANALYTICS */}
        {tab === "analytics" && (
          <div className="space-y-8">
            <h1 className="font-['DM_Serif_Display',serif] text-3xl text-white">Network Analytics</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl p-4 md:p-6 border border-white/[0.07] bg-white/[0.04]">
                <p className="text-white font-semibold mb-5">Daily Order Volume</p>
                <OrderVolumeChart data={SALES_TREND.slice(-14)} />
              </div>
              <div className="rounded-2xl p-6 border border-white/[0.07] bg-white/[0.04]">
                <p className="text-white font-semibold mb-5">Revenue vs Commission</p>
                <RevenueCommissionChart data={SALES_TREND.slice(-14)} />
              </div>
            </div>
          </div>
        )}

        {/* HUB ANALYTICS */}
        {tab === "hub" && (
          <div className="space-y-8">
            <h1 className="font-['DM_Serif_Display',serif] text-3xl text-white">Hub Analytics</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                ["🏢", "Kampala Boulevard", "68.2%", "Primary hub"],
                ["🪑", "Burton Street",      "22.4%", "Secondary hub"],
                ["🚚", "Home Delivery",      "9.4%",  "On-demand"],
              ].map(([icon, n, pct, sub]) => (
                <div key={n} className="rounded-2xl p-5 border border-white/[0.07] bg-white/[0.04]">
                  <span className="text-2xl mb-3 block">{icon}</span>
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/35 mb-1">{n}</p>
                  <p className="font-['JetBrains_Mono',monospace] text-2xl text-white font-bold">{pct}</p>
                  <p className="text-white/30 text-xs mt-1">{sub}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl p-6 border border-[#D4AF37]/20 bg-[linear-gradient(135deg,rgba(212,175,55,0.08),rgba(34,139,34,0.06))]">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#D4AF37] mb-2">Primary Hub</p>
              <h3 className="font-['DM_Serif_Display',serif] text-2xl text-white mb-1">Kampala Boulevard</h3>
              <p className="text-white/40 text-sm mb-4">Plot 17/19 Kampala Boulevard, Kampala, Uganda · ⭐ 4.3</p>
              <div className="flex flex-wrap gap-6">
                {[
                  ["68.2%",    "of all orders"],
                  ["182",      "total pickups"],
                  ["UGX 52.4M","revenue"],
                ].map(([v, l]) => (
                  <div key={l}>
                    <p className="font-mono text-xl text-[#228B22] font-bold">{v}</p>
                    <p className="text-white/40 text-xs">{l}</p>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => window.open("https://maps.google.com/?q=Plot+17/19+Kampala+Boulevard+Uganda", "_blank")}
                className="mt-4 px-4 py-2 rounded-xl bg-[#D4AF37] text-[#1a1202] text-sm font-bold hover:bg-[#c49a2e] transition-colors"
              >
                Open in Google Maps →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
