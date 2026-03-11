// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — SIDEBAR COMPONENT (Responsive)
// File: components/sidebar.tsx
// Hidden on mobile (mobile-nav.tsx handles mobile navigation)
// ═══════════════════════════════════════════════════════════════════════════════

export function Sidebar({ items = [] }: { items?: { href: string; icon: string; label: string }[] }) {
  return (
    <aside className="hidden md:flex w-64 h-[100dvh] bg-[#081208] border-r border-white/10 p-4 flex-col flex-shrink-0">
      <div className="flex items-center gap-2 mb-6 px-2">
        <span className="text-2xl">⬡</span>
        <span className="font-semibold text-white">BF Suma</span>
      </div>
      <nav className="space-y-1 flex-1 overflow-y-auto">
        {items.map(item => (
          <a 
            key={item.href} 
            href={item.href} 
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors min-h-[44px]"
          >
            <span>{item.icon}</span>
            <span className="text-sm">{item.label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}
