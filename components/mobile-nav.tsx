"use client";
// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — MOBILE NAVIGATION COMPONENT
// File: components/mobile-nav.tsx
// Provides hamburger menu, slide-out sidebar, and bottom nav for mobile
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Menu,
  X,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Radio,
  BarChart3,
  Package,
  Truck,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MobileNavProps {
  role: "admin" | "distributor" | "client";
  currentPath: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

// ── Navigation items by role ──────────────────────────────────────────────────

const NAV_ITEMS: Record<MobileNavProps["role"], NavItem[]> = {
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { href: "/admin/settings",  label: "Settings",  icon: <Settings size={20} /> },
    { href: "/admin/mfa",       label: "MFA",        icon: <ShieldCheck size={20} /> },
    { href: "/admin/dashboard",  label: "Command",   icon: <Radio size={20} /> },
  ],
  distributor: [
    { href: "/distributor/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { href: "/tracking",              label: "Tracking",  icon: <Truck size={20} /> },
    { href: "/packages",              label: "Packages",  icon: <Package size={20} /> },
  ],
  client: [
    { href: "/client/analytics", label: "Analytics", icon: <BarChart3 size={20} /> },
    { href: "/tracking",         label: "Tracking",  icon: <Truck size={20} /> },
    { href: "/packages",         label: "Packages",  icon: <Package size={20} /> },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE NAV COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function MobileNav({ role, currentPath }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);

  const items = NAV_ITEMS[role];

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Touch handlers for swipe-to-dismiss
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchCurrentX.current = e.touches[0].clientX;
    const diff = touchStartX.current - touchCurrentX.current;
    // If swiping left (to close), translate the sidebar
    if (diff > 0 && sidebarRef.current) {
      sidebarRef.current.style.transform = `translateX(-${Math.min(diff, 280)}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchCurrentX.current;
    if (diff > 80) {
      // Swipe threshold met — close
      setIsOpen(false);
    }
    // Reset transform
    if (sidebarRef.current) {
      sidebarRef.current.style.transform = "";
    }
  }, []);

  const isActive = (href: string) => currentPath === href || currentPath.startsWith(href + "/");

  return (
    <>
      {/* ── Hamburger Button (top-left, mobile only) ── */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 flex items-center justify-center w-11 h-11 rounded-xl bg-[#081208]/90 border border-white/10 text-white/70 hover:text-white hover:bg-[#081208] transition-all backdrop-blur-sm"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        aria-label="Open navigation menu"
      >
        <Menu size={22} />
      </button>

      {/* ── Overlay ── */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Slide-out Sidebar ── */}
      <div
        ref={sidebarRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`md:hidden fixed top-0 left-0 z-[70] h-[100dvh] w-[280px] flex flex-col bg-[#081208] border-r border-white/[0.08] shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#228B22] to-[#1a6b1a] flex items-center justify-center text-base shadow-[0_4px_18px_rgba(34,139,34,0.4)]">
              ⬡
            </div>
            <div>
              <p className="font-['DM_Serif_Display',serif] text-[17px] text-white leading-none">
                BF Suma
              </p>
              <p className="text-[8.5px] tracking-[0.18em] text-[#D4AF37] uppercase font-bold">
                {role === "admin" ? "Command Center" : role === "distributor" ? "Distributor" : "Client"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold transition-all min-h-[44px] ${
                isActive(item.href)
                  ? "bg-[#228B22]/20 text-[#228B22] border border-[#228B22]/20"
                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.06]">
          <p className="text-[11px] text-white/20 leading-relaxed">
            BF Suma Nexus v6.0
            <br />
            🔒 Supabase RLS · All actions logged
          </p>
        </div>
      </div>

      {/* ── Bottom Navigation Bar (mobile only) ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around bg-[#081208]/95 border-t border-white/[0.08] backdrop-blur-md"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}
      >
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-[64px] min-h-[52px] transition-colors ${
              isActive(item.href)
                ? "text-[#228B22]"
                : "text-white/35 hover:text-white/60"
            }`}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span className="text-[10px] font-semibold leading-none">{item.label}</span>
          </a>
        ))}
      </nav>
    </>
  );
}
