'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Sidebar } from './sidebar';
import { NotificationBell } from '@/components/ui/notification-bell';
import { useRealtimeNotifications } from '@/hooks/use-realtime';
import type { Profile, NavItem, Notification } from '@/types';

interface DashboardLayoutProps {
  profile: Profile;
  navItems: NavItem[];
  children: React.ReactNode;
  title?: string;
  brandLabel?: string;
}

export function DashboardLayout({
  profile,
  navItems,
  children,
  title,
  brandLabel,
}: DashboardLayoutProps) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useRealtimeNotifications(profile.id);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  }, [supabase, router]);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <Sidebar
        profile={profile}
        navItems={navItems}
        onSignOut={handleSignOut}
        brandLabel={brandLabel}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex-shrink-0">
          <h1 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            {title}
          </h1>
          <div className="flex items-center gap-2">
            <NotificationBell
              notifications={notifications as Notification[]}
              unreadCount={unreadCount}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
            />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
