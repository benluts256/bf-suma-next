import { jsonErr, jsonOk, parseJson } from '@/lib/api/http';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getAuthUser } from '@/lib/auth/helpers';
import { notificationMarkReadSchema } from '@/lib/schemas/notifications';

export async function POST(request: Request) {
  try {
    const body = await parseJson(request, notificationMarkReadSchema);
    if (!body.ok) return Response.json(body.result, { status: 400 });

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
      .eq('id', body.data.notificationId)
      .eq('user_id', profile.id);

    if (error) {
      console.error('Mark notification read error:', error);
      return jsonErr('INTERNAL_ERROR', 'Failed to update notification', { status: 500 });
    }

    return jsonOk({ success: true });
  } catch (e) {
    console.error('Mark notification read route error:', e);
    return jsonErr('INTERNAL_ERROR', 'Internal server error', { status: 500 });
  }
}

