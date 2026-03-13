import { jsonErr, jsonOk } from '@/lib/api/http';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getAuthUser } from '@/lib/auth/helpers';

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getAuthUser(supabase);
    if (!user) return jsonErr('UNAUTHORIZED', 'Unauthorized', { status: 401 });

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (profileErr || !profile) return jsonErr('NOT_FOUND', 'Profile not found', { status: 404 });

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', profile.id)
      .eq('is_read', false);

    if (error) {
      console.error('Mark all notifications read error:', error);
      return jsonErr('INTERNAL_ERROR', 'Failed to update notifications', { status: 500 });
    }

    return jsonOk({ success: true });
  } catch (e) {
    console.error('Mark all notifications read route error:', e);
    return jsonErr('INTERNAL_ERROR', 'Internal server error', { status: 500 });
  }
}

