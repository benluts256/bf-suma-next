'use client';

import { timeAgo, getInitials } from '@/lib/utils/format';
import type { ActivityLog } from '@/types';
import {
  LogIn, LogOut, UserPlus, Package, MapPin, MessageSquare,
  CreditCard, Settings, Activity,
} from 'lucide-react';

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  login: <LogIn className="w-4 h-4" />,
  logout: <LogOut className="w-4 h-4" />,
  signup: <UserPlus className="w-4 h-4" />,
  order_created: <Package className="w-4 h-4" />,
  order_updated: <Package className="w-4 h-4" />,
  order_completed: <Package className="w-4 h-4" />,
  client_assigned: <UserPlus className="w-4 h-4" />,
  client_removed: <LogOut className="w-4 h-4" />,
  location_updated: <MapPin className="w-4 h-4" />,
  message_sent: <MessageSquare className="w-4 h-4" />,
  subscription_created: <CreditCard className="w-4 h-4" />,
  subscription_updated: <CreditCard className="w-4 h-4" />,
  subscription_canceled: <CreditCard className="w-4 h-4" />,
  profile_updated: <Settings className="w-4 h-4" />,
  settings_changed: <Settings className="w-4 h-4" />,
};

interface ActivityFeedProps {
  activities: ActivityLog[];
  maxItems?: number;
}

export function ActivityFeed({ activities, maxItems = 10 }: ActivityFeedProps) {
  const items = activities.slice(0, maxItems);

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-400 text-sm">
        No recent activity
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {items.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
            {activity.user ? (
              <span className="text-[10px] font-bold">
                {getInitials(activity.user.full_name)}
              </span>
            ) : (
              <Activity className="w-3.5 h-3.5" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {ACTIVITY_ICONS[activity.activity] ?? <Activity className="w-4 h-4" />}
              </span>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 truncate">
                {activity.description ?? activity.activity.replace(/_/g, ' ')}
              </p>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {activity.user?.full_name && (
                <span className="font-medium text-zinc-500">{activity.user.full_name} · </span>
              )}
              {timeAgo(activity.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
