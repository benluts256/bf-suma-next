"use client";
// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — NAVBAR COMPONENT (Responsive)
// File: components/navbar.tsx
// Desktop: full nav links | Mobile: hamburger menu trigger
// ═══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Navbar({ links = [] }: { links?: { href: string; label: string }[] }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 py-3 md:py-4 bg-white border-b border-zinc-200">
      <div className="flex items-center gap-2">
        <span className="text-xl">⬡</span>
        <span className="font-semibold text-[#1a3a1a]">BF Suma</span>
      </div>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-4">
        {links.map(link => (
          <a key={link.href} href={link.href} className="text-sm text-zinc-600 hover:text-[#228B22] transition-colors">
            {link.label}
          </a>
        ))}
      </div>

      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden flex items-center justify-center w-11 h-11 rounded-lg text-zinc-600 hover:text-[#228B22] hover:bg-zinc-100 transition-colors"
        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
      >
        {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-zinc-200 shadow-lg z-20">
          <div className="flex flex-col p-4 space-y-1">
            {links.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-zinc-600 hover:text-[#228B22] hover:bg-zinc-50 px-4 py-3 rounded-lg transition-colors min-h-[44px] flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
