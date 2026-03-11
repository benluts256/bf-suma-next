"use client";
// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — PAGE MOBILE NAV WRAPPER
// File: components/page-mobile-nav.tsx
// Client component wrapper to add MobileNav to server-rendered pages
// ═══════════════════════════════════════════════════════════════════════════════

import { usePathname } from "next/navigation";
import MobileNav from "@/components/mobile-nav";

interface PageMobileNavProps {
  role: "admin" | "distributor" | "client";
}

export default function PageMobileNav({ role }: PageMobileNavProps) {
  const pathname = usePathname();
  return <MobileNav role={role} currentPath={pathname} />;
}
