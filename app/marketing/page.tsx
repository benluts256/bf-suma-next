// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS v6.0 — MARKETING PAGE
// File: app/marketing/page.tsx
// Public marketing landing page
// ═══════════════════════════════════════════════════════════════════════════════

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "BF Suma Nexus — Uganda's Premier Supplement Platform",
  description: "Join Uganda's fastest-growing wellness distribution network. Premium supplements, wellness tracking, and more.",
};

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-[#fafaf9]">
      {/* Hero */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#228B22]/10 to-[#D4AF37]/10" />
        <div className="max-w-4xl mx-auto relative">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#228B22] to-[#1a6b1a] flex items-center justify-center text-3xl shadow-lg">
              ⬡
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#1a3a1a] mb-4">
              BF Suma Nexus
            </h1>
            <p className="text-lg text-zinc-600 mb-8 max-w-xl mx-auto">
              Uganda&apos;s premier supplement distribution &amp; wellness platform. 
              Premium products, distributor network, and personalized wellness tracking.
            </p>
            <div className="flex gap-4 justify-center">
              <Link 
                href="/auth"
                className="px-6 py-3 bg-[#228B22] text-white font-semibold rounded-xl hover:bg-[#1a6b1a] transition-colors"
              >
                Get Started →
              </Link>
              <Link 
                href="/auth?mode=login"
                className="px-6 py-3 bg-white text-[#228B22] font-semibold rounded-xl border-2 border-[#228B22] hover:bg-[#228B22]/5 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#1a3a1a] text-center mb-12">
            Why Choose BF Suma Nexus?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-3xl mb-3">🌿</div>
              <h3 className="font-semibold text-[#1a3a1a] mb-2">Premium Supplements</h3>
              <p className="text-sm text-zinc-500">
                Curated selection of high-quality wellness products from trusted sources.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-3xl mb-3">🤝</div>
              <h3 className="font-semibold text-[#1a3a1a] mb-2">Distributor Network</h3>
              <p className="text-sm text-zinc-500">
                Join our growing network of distributors across Uganda.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold text-[#1a3a1a] mb-2">Wellness Tracking</h3>
              <p className="text-sm text-zinc-500">
                Personalize your wellness journey with our tracking tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-zinc-200">
        <div className="max-w-4xl mx-auto text-center text-sm text-zinc-400">
          © {new Date().getFullYear()} BF Suma Nexus. Uganda.
        </div>
      </footer>
    </main>
  );
}
