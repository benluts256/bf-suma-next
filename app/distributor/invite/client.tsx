'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — DISTRIBUTOR INVITE CLIENTS CLIENT COMPONENT
// app/distributor/invite/client.tsx
// ═══════════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import {
  LayoutDashboard, Users, Package, MessageSquare,
  MapPin, Mail, Copy, Check, Clock, UserCheck, X
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/layout';
import type { Profile, Distributor, ClientInvite } from '@/types';

// ── Nav items ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/distributor/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/distributor/clients', label: 'My Clients', icon: <Users className="w-4 h-4" /> },
  { href: '/distributor/invite', label: 'Invite Clients', icon: <Users className="w-4 h-4" /> },
  { href: '/distributor/orders', label: 'Orders', icon: <Package className="w-4 h-4" /> },
  { href: '/distributor/messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4" /> },
  { href: '/distributor/location', label: 'Location', icon: <MapPin className="w-4 h-4" /> },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface DistributorInviteClientProps {
  profile: Profile;
  distributor: Distributor | null;
  invites: ClientInvite[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function DistributorInviteClient({
  profile,
  distributor,
  invites,
}: DistributorInviteClientProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invite');
      }

      setSuccess(`Invite sent to ${email}`);
      setEmail('');

      // Refresh the page to show new invite
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = async (invite: ClientInvite) => {
    const link = `${window.location.origin}/auth?invite=${invite.token}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedInvite(invite.id);
      setTimeout(() => setCopiedInvite(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <UserCheck className="w-4 h-4 text-green-600" />;
      case 'expired':
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'text-green-700 bg-green-100';
      case 'expired':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-yellow-700 bg-yellow-100';
    }
  };

  return (
    <DashboardLayout
      profile={profile}
      navItems={NAV_ITEMS}
      title="Invite Clients"
    >
      <div className="space-y-6">
        {/* Invite Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Send Client Invitation</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Client Email Address
              </label>
              <div className="flex gap-3">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  {loading ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Invites List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Sent Invitations</h2>
            <p className="text-sm text-gray-600 mt-1">Track the status of your client invitations</p>
          </div>

          <div className="divide-y divide-gray-200">
            {invites.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No invitations sent yet</p>
              </div>
            ) : (
              invites.map((invite) => (
                <div key={invite.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(invite.status)}
                      <div>
                        <p className="font-medium text-gray-900">{invite.email}</p>
                        <p className="text-sm text-gray-600">
                          Sent {new Date(invite.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${getStatusColor(invite.status)}`}>
                        {invite.status}
                      </span>

                      {invite.status === 'pending' && (
                        <button
                          onClick={() => copyInviteLink(invite)}
                          className="text-gray-400 hover:text-gray-600 p-1"
                          title="Copy invite link"
                        >
                          {copiedInvite === invite.id ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      {invite.client && (
                        <div className="text-sm text-gray-600">
                          Joined as {invite.client.profile?.full_name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}