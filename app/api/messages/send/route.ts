import { jsonErr, jsonOk, parseJson } from '@/lib/api/http';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getAuthUser } from '@/lib/auth/helpers';
import { sendMessageSchema } from '@/lib/schemas/messages';
import { sendMessage } from '@/services/messages';

export async function POST(request: Request) {
  try {
    const body = await parseJson(request, sendMessageSchema);
    if (!body.ok) return Response.json(body.result, { status: 400 });

    const supabase = await createSupabaseServerClient();
    const user = await getAuthUser(supabase);
    if (!user) return jsonErr('UNAUTHORIZED', 'Unauthorized', { status: 401 });

    const { data: senderProfile, error: senderErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (senderErr || !senderProfile) return jsonErr('NOT_FOUND', 'Profile not found', { status: 404 });

    const msg = await sendMessage(
      supabase,
      senderProfile.id as string,
      body.data.receiverId,
      body.data.content,
      body.data.messageType ?? 'text'
    );

    if (!msg) return jsonErr('FORBIDDEN', 'Not allowed to message this user', { status: 403 });

    return jsonOk({ message: msg });
  } catch (e) {
    console.error('Send message route error:', e);
    return jsonErr('INTERNAL_ERROR', 'Internal server error', { status: 500 });
  }
}

