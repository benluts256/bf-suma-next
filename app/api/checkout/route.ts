import { jsonErr, jsonOk, parseJson } from '@/lib/api/http';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getAuthUser } from '@/lib/auth';
import { checkoutCreateSchema } from '@/lib/schemas/checkout';

function mapCheckoutError(message: string) {
  const m = message.toLowerCase();
  if (m.includes('insufficient stock')) return { code: 'CONFLICT' as const, status: 409, message: 'Insufficient stock' };
  if (m.includes('product unavailable')) return { code: 'CONFLICT' as const, status: 409, message: 'Product unavailable' };
  if (m.includes('no items provided') || m.includes('invalid item payload')) {
    return { code: 'VALIDATION_ERROR' as const, status: 400, message: 'Invalid checkout payload' };
  }
  return { code: 'INTERNAL_ERROR' as const, status: 500, message: 'Checkout failed' };
}

export async function POST(request: Request) {
  try {
    const body = await parseJson(request, checkoutCreateSchema);
    if (!body.ok) return Response.json(body.result, { status: 400 });

    const sessionSupabase = await createSupabaseServerClient();
    const user = await getAuthUser(sessionSupabase);
    if (!user) return jsonErr('UNAUTHORIZED', 'Unauthorized', { status: 401 });

    // Resolve client_id (DB row) for authenticated user
    const { data: profile, error: profileErr } = await sessionSupabase
      .from('profiles')
      .select('id, role')
      .eq('auth_user_id', user.id)
      .single();

    if (profileErr || !profile) return jsonErr('NOT_FOUND', 'Profile not found', { status: 404 });
    if (profile.role !== 'client') return jsonErr('FORBIDDEN', 'Only clients can checkout', { status: 403 });

    const { data: client, error: clientErr } = await sessionSupabase
      .from('clients')
      .select('id')
      .eq('profile_id', profile.id)
      .single();

    if (clientErr || !client) return jsonErr('NOT_FOUND', 'Client record not found', { status: 404 });

    const admin = getSupabaseAdminClient();

    // Postgres function expects keys: product_id + quantity
    const items = body.data.items.map((i) => ({ product_id: i.productId, quantity: i.quantity }));

    const { data: orderId, error } = await admin.rpc('create_order_atomic', {
      _client_id: client.id,
      _shipping_address: body.data.shippingAddress ?? null,
      _items: items,
    });

    if (error) {
      console.error('Checkout RPC error:', error);
      const mapped = mapCheckoutError(error.message);
      return jsonErr(mapped.code, mapped.message, { status: mapped.status });
    }

    if (!orderId) {
      return jsonErr('INTERNAL_ERROR', 'Checkout failed', { status: 500 });
    }

    return jsonOk({ orderId });
  } catch (e) {
    console.error('Checkout route error:', e);
    return jsonErr('INTERNAL_ERROR', 'Internal server error', { status: 500 });
  }
}

