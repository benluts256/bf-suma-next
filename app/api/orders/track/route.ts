import { jsonErr, jsonOk, parseJson } from '@/lib/api/http';
import { orderTrackSchema } from '@/lib/schemas/orders';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await parseJson(request, orderTrackSchema);
    if (!body.ok) {
      return Response.json(body.result, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { orderId } = body.data;

    const { data, error } = await supabase
      .from('orders')
      .select('id, status, estimated_delivery, created_at, total_amount, items_count, shipping_address')
      .eq('id', orderId)
      .maybeSingle();

    if (error) {
      // Don't leak DB details to clients
      console.error('Order track error:', error);
      return jsonErr('INTERNAL_ERROR', 'Failed to track order', { status: 500 });
    }

    if (!data) {
      return jsonErr('NOT_FOUND', 'Order not found', { status: 404 });
    }

    return jsonOk({ order: data });
  } catch (e) {
    console.error('Order track route error:', e);
    return jsonErr('INTERNAL_ERROR', 'Internal server error', { status: 500 });
  }
}

