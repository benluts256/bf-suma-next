import { jsonErr, jsonOk } from '@/lib/api/http';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getAuthUser } from '@/lib/auth/helpers';

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getAuthUser(supabase);
    if (!user) return jsonErr('UNAUTHORIZED', 'Unauthorized', { status: 401 });

    // Best-effort role check (profiles table is authoritative when present)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (profile && profile.role !== 'manager') {
      return jsonErr('FORBIDDEN', 'Forbidden', { status: 403 });
    }

    // This table is referenced in the app; may exist even if schema.sql is outdated.
    const { error } = await supabase
      .from('manager_profiles')
      .update({ mfa_verified_at: new Date().toISOString() })
      .eq('auth_user_id', user.id);

    if (error) {
      console.error('Update manager_profiles mfa_verified_at error:', error);
      return jsonErr('INTERNAL_ERROR', 'Failed to update MFA status', { status: 500 });
    }

    return jsonOk({ success: true });
  } catch (e) {
    console.error('MFA verified route error:', e);
    return jsonErr('INTERNAL_ERROR', 'Internal server error', { status: 500 });
  }
}

