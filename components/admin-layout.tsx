"use client";
// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — RESPONSIVE ADMIN LAYOUT
// File: components/admin-layout.tsx
// Desktop: sidebar + content | Mobile: hamburger + bottom nav + content
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { usePathname } from "next/navigation";
import MobileNav from "@/components/mobile-nav";
import {
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Radio,
  Truck,
  Package,
  BarChart3,
  LogOut,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminLayoutProps {
  children: React.ReactNode;
  role: "admin" | "distributor" | "client";
  userName?: string;
  userEmail?: string;
}

interface SidebarNavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

// ── Sidebar nav items by role ─────────────────────────────────────────────────

const SIDEBAR_ITEMS: Record<AdminLayoutProps["role"], SidebarNavItem[]> = {
  admin: [
    { href: "/admin/dashboard", label: "Dashboard",      icon: <LayoutDashboard size={16} /> },
    { href: "/admin/settings",  label: "Settings",       icon: <Settings size={16} /> },
    { href: "/admin/mfa",       label: "MFA",            icon: <ShieldCheck size={16} /> },
    { href: "/admin/dashboard", label: "Command Center", icon: <Radio size={16} /> },
  ],
  distributor: [
    { href: "/distributor/dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { href: "/tracking",              label: "Tracking",  icon: <Truck size={16} /> },
    { href: "/packages",              label: "Packages",  icon: <Package size={16} /> },
  ],
  client: [
    { href: "/client/analytics", label: "Analytics", icon: <BarChart3 size={16} /> },
    { href: "/tracking",         label: "Tracking",  icon: <Truck size={16} /> },
    { href: "/packages",         label: "Packages",  icon: <Package size={16} /> },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN LAYOUT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function AdminLayout({
  children,
  role,
  userName,
  userEmail,
}: AdminLayoutProps) {
  const pathname = usePathname();
  const items = SIDEBAR_ITEMS[role];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const roleLabel =
    role === "admin"
      ? "Command Center"
      : role === "distributor"
        ? "Distributor Portal"
        : "Client Portal";

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#040D06] font-['Outfit',sans-serif]">
      {/* ── Desktop Sidebar (hidden on mobile) ── */}
      <aside className="hidden md:flex md:w-[230px] flex-shrink-0 flex-col border-r border-white/[0.06] bg-[#081208]">
        {/* Logo */}
        <div className="p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#228B22] to-[#1a6b1a] flex items-center justify-center text-base shadow-[0_4px_18px_rgba(34,139,34,0.4)]">
              ⬡
            </div>
            <div>
              <p className="font-['DM_Serif_Display',serif] text-[17px] text-white leading-none">
                BF Suma
              </p>
              <p className="text-[8.5px] tracking-[0.18em] text-[#D4AF37] uppercase font-bold">
                {roleLabel}
              </p>
            </div>
          </div>
        </div>

        {/* User info */}
        {userName && (
          <div className="px-4 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.04]">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#228B22] to-[#1a6b1a] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {userName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white text-[12.5px] font-semibold truncate">
                  {userName}
                </p>
                {userEmail && (
                  <p className="text-white/30 text-[10px] truncate">{userEmail}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {items.map((item) => (
            <a
              key={item.href + item.label}
              href={item.href}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                isActive(item.href)
                  ? "bg-[#228B22]/20 text-[#228B22] border border-[#228B22]/20"
                  : "text-white/45 hover:text-white/70 hover:bg-white/[0.04]"
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        {/* Sign out */}
        <div className="p-3 border-t border-white/[0.06]">
          <a
            href="/auth"
            className="w-full flex items-center gap-2 py-2 px-3 text-[12px] text-white/30 hover:text-white/60 transition-colors font-medium rounded-lg hover:bg-white/[0.04]"
          >
            <LogOut size={14} />
            Sign out
          </a>
        </div>
      </aside>

      {/* ── Mobile Navigation (hidden on desktop) ── */}
      <MobileNav role={role} currentPath={pathname} />

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto min-w-0 pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
}
