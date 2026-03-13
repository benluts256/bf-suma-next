// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — Client Invitation API
// File: app/api/invites/route.ts
// Handles creating and managing client invitations
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getAuthUser } from '@/lib/auth';
import { randomBytes } from 'crypto';
import { parseJson, jsonErr, jsonOk } from '@/lib/api/http';
import { createInviteSchema } from '@/lib/schemas/invites';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getAuthUser(supabase);

    if (!user) {
      return jsonErr('UNAUTHORIZED', 'Unauthorized', { status: 401 });
    }

    // Get user's role and distributor info
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (!profile || profile.role !== 'distributor') {
      return jsonErr('FORBIDDEN', 'Only distributors can send invites', { status: 403 });
    }

    const { data: distributor } = await supabase
      .from('distributors')
      .select('id')
      .eq('profile_id', profile.id)
      .single();

    if (!distributor) {
      return jsonErr('NOT_FOUND', 'Distributor profile not found', { status: 404 });
    }

    const body = await parseJson(request, createInviteSchema);
    if (!body.ok) {
      return NextResponse.json(body.result, { status: 400 });
    }

    const { email } = body.data;

    // Check if invite already exists and is pending
    const { data: existingInvite } = await supabase
      .from('client_invites')
      .select('id, status')
      .eq('email', email)
      .eq('distributor_id', distributor.id)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return jsonErr('CONFLICT', 'Invite already sent to this email', { status: 409 });
    }

    // Check if user is already a client of this distributor
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('distributor_id', distributor.id)
      .eq('email', email)
      .single();

    if (existingClient) {
      return jsonErr('CONFLICT', 'User is already a client', { status: 409 });
    }

    // Generate unique token
    const token = randomBytes(32).toString('hex');

    // Create invite
    const { data: invite, error } = await supabase
      .from('client_invites')
      .insert({
        distributor_id: distributor.id,
        email,
        token,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invite:', error);
      return jsonErr('INTERNAL_ERROR', 'Failed to create invite', { status: 500 });
    }

    // TODO: Send email with invite link
    // For now, just return the invite data

    return jsonOk({
      invite: {
        id: invite.id,
        email: invite.email,
        token: invite.token,
        expires_at: invite.expires_at,
      }
    });

  } catch (error) {
    console.error('Invite API error:', error);
    return jsonErr('INTERNAL_ERROR', 'Internal server error', { status: 500 });
  }
}

// Get invites for the current distributor
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getAuthUser(supabase);

    if (!user) {
      return jsonErr('UNAUTHORIZED', 'Unauthorized', { status: 401 });
    }

    // Get user's role and distributor info
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (!profile || profile.role !== 'distributor') {
      return jsonErr('FORBIDDEN', 'Only distributors can view invites', { status: 403 });
    }

    const { data: distributor } = await supabase
      .from('distributors')
      .select('id')
      .eq('profile_id', profile.id)
      .single();

    if (!distributor) {
      return jsonErr('NOT_FOUND', 'Distributor profile not found', { status: 404 });
    }

    const { data: invites, error } = await supabase
      .from('client_invites')
      .select(`
        id,
        email,
        status,
        expires_at,
        accepted_at,
        created_at,
        client:clients(id, profile:profiles(full_name, email))
      `)
      .eq('distributor_id', distributor.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invites:', error);
      return jsonErr('INTERNAL_ERROR', 'Failed to fetch invites', { status: 500 });
    }

    return jsonOk({ invites });

  } catch (error) {
    console.error('Get invites API error:', error);
    return jsonErr('INTERNAL_ERROR', 'Internal server error', { status: 500 });
  }
}