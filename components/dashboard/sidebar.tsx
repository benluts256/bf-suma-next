'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut, ChevronRight } from 'lucide-react';
import { getInitials } from '@/lib/utils/format';
import type { NavItem } from '@/types';
import type { Profile } from '@/types';

interface SidebarProps {
  profile: Profile;
  navItems: NavItem[];
  onSignOut: () => void;
  brandLabel?: string;
}

export function Sidebar({ profile, navItems, onSignOut, brandLabel }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const roleLabel = brandLabel ?? {
    admin: 'Command Center',
    distributor: 'Distributor Portal',
    client: 'Client Portal',
  }[profile.role] ?? 'Portal';

  return (
    <aside className="hidden md:flex md:w-[240px] flex-shrink-0 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 h-[100dvh]">
      {/* Logo */}
      <div className="p-5 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-base font-bold shadow-lg shadow-emerald-500/20">
            ⬡
          </div>
          <div>
            <p className="font-bold text-[15px] text-zinc-900 dark:text-white leading-none">
              BF Suma
            </p>
            <p className="text-[9px] tracking-[0.2em] text-emerald-600 dark:text-emerald-400 uppercase font-semibold mt-0.5">
              {roleLabel}
            </p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {getInitials(profile.full_name || profile.email)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
              {profile.full_name || 'User'}
            </p>
            <p className="text-[11px] text-zinc-400 truncate">{profile.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
              isActive(item.href)
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900'
            }`}
          >
            <span className="flex-shrink-0 w-4 h-4">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
            {isActive(item.href) && (
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            )}
          </Link>
        ))}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-zinc-100 dark:border-zinc-800">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl transition-colors font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
