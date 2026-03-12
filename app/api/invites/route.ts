// ═══════════════════════════════════════════════════════════════════════════════
// BF SUMA NEXUS — Client Invitation API
// File: app/api/invites/route.ts
// Handles creating and managing client invitations
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getAuthUser } from '@/lib/auth';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getAuthUser(supabase);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's role and distributor info
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (!profile || profile.role !== 'distributor') {
      return NextResponse.json({ error: 'Only distributors can send invites' }, { status: 403 });
    }

    const { data: distributor } = await supabase
      .from('distributors')
      .select('id')
      .eq('profile_id', profile.id)
      .single();

    if (!distributor) {
      return NextResponse.json({ error: 'Distributor profile not found' }, { status: 404 });
    }

    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    // Check if invite already exists and is pending
    const { data: existingInvite } = await supabase
      .from('client_invites')
      .select('id, status')
      .eq('email', email)
      .eq('distributor_id', distributor.id)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return NextResponse.json({ error: 'Invite already sent to this email' }, { status: 409 });
    }

    // Check if user is already a client of this distributor
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('distributor_id', distributor.id)
      .eq('email', email)
      .single();

    if (existingClient) {
      return NextResponse.json({ error: 'User is already a client' }, { status: 409 });
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
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
    }

    // TODO: Send email with invite link
    // For now, just return the invite data

    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        email: invite.email,
        token: invite.token,
        expires_at: invite.expires_at,
      }
    });

  } catch (error) {
    console.error('Invite API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get invites for the current distributor
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getAuthUser(supabase);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's role and distributor info
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (!profile || profile.role !== 'distributor') {
      return NextResponse.json({ error: 'Only distributors can view invites' }, { status: 403 });
    }

    const { data: distributor } = await supabase
      .from('distributors')
      .select('id')
      .eq('profile_id', profile.id)
      .single();

    if (!distributor) {
      return NextResponse.json({ error: 'Distributor profile not found' }, { status: 404 });
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
      return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
    }

    return NextResponse.json({ invites });

  } catch (error) {
    console.error('Get invites API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}