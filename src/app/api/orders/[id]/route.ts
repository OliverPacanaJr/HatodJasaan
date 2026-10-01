import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready_for_pickup', 'cancelled'],
  ready_for_pickup: ['rider_assigned', 'picked_up'],
  rider_assigned: ['picked_up'],
  picked_up: ['on_the_way'],
  on_the_way: ['delivered'],
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: order } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*, menu_item:menu_items(name, image_url)),
        business:businesses(id, name, logo_url, address, phone),
        customer:profiles!orders_customer_id_fkey(id, full_name, phone, avatar_url),
        rider:profiles!orders_rider_id_fkey(id, full_name, phone, avatar_url),
        reviews(*)
      `)
      .eq('id', params.id)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: order } = await supabase
      .from('orders')
      .select('*, business:businesses(owner_id, name)')
      .eq('id', params.id)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

    const isCustomer = order.customer_id === user.id;
    const isBusinessOwner = order.business?.owner_id === user.id;
    const isRider = order.rider_id === user.id;
    const isAdmin = profile?.role === 'admin';

    if (!isCustomer && !isBusinessOwner && !isRider && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { status, rider_id, cancellation_reason } = body;

    if (status) {
      const allowed = VALID_TRANSITIONS[order.status];
      if (!allowed?.includes(status) && !isAdmin) {
        return NextResponse.json({ error: `Cannot transition from ${order.status} to ${status}` }, { status: 400 });
      }

      const updates: Record<string, unknown> = { status };
      const now = new Date().toISOString();

      if (status === 'confirmed') updates.confirmed_at = now;
      if (status === 'preparing') updates.preparing_at = now;
      if (status === 'ready_for_pickup') updates.ready_at = now;
      if (status === 'picked_up') updates.picked_up_at = now;
      if (status === 'delivered') updates.delivered_at = now;
      if (status === 'cancelled') {
        updates.cancelled_at = now;
        updates.cancellation_reason = cancellation_reason || 'Cancelled';
      }
      if (status === 'rider_assigned' && rider_id) {
        updates.rider_id = rider_id;
      }

      const { error } = await supabase.from('orders').update(updates).eq('id', params.id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const notifTargets: { user_id: string; title: string; body: string }[] = [];

      if (status === 'confirmed') {
        notifTargets.push({
          user_id: order.customer_id,
          title: 'Order Confirmed',
          body: `${order.business?.name} confirmed your order ${order.order_number}`,
        });
      }
      if (status === 'ready_for_pickup') {
        notifTargets.push({
          user_id: order.customer_id,
          title: 'Order Ready',
          body: `Your order ${order.order_number} is ready for pickup`,
        });
      }
      if (status === 'on_the_way') {
        notifTargets.push({
          user_id: order.customer_id,
          title: 'On the Way!',
          body: `Your order ${order.order_number} is on its way to you`,
        });
      }
      if (status === 'delivered') {
        notifTargets.push({
          user_id: order.customer_id,
          title: 'Order Delivered',
          body: `Your order ${order.order_number} has been delivered. Enjoy!`,
        });
        if (order.rider_id) {
          await supabase.rpc('', {}).catch(() => {});
          await supabase
            .from('rider_profiles')
            .update({
              total_deliveries: (await supabase.from('rider_profiles').select('total_deliveries').eq('user_id', order.rider_id).single()).data?.total_deliveries + 1 || 1,
              total_earnings: (await supabase.from('rider_profiles').select('total_earnings').eq('user_id', order.rider_id).single()).data?.total_earnings + order.delivery_fee || order.delivery_fee,
            })
            .eq('user_id', order.rider_id);
        }
      }
      if (status === 'cancelled') {
        notifTargets.push({
          user_id: order.customer_id,
          title: 'Order Cancelled',
          body: `Order ${order.order_number} has been cancelled`,
        });
        if (order.business?.owner_id) {
          notifTargets.push({
            user_id: order.business.owner_id,
            title: 'Order Cancelled',
            body: `Order ${order.order_number} has been cancelled`,
          });
        }
      }

      if (notifTargets.length > 0) {
        await supabase.from('notifications').insert(
          notifTargets.map((n) => ({
            ...n,
            type: 'order_update' as const,
            data: { order_id: order.id, order_number: order.order_number },
          }))
        );
      }
    }

    const { data: updated } = await supabase.from('orders').select('*').eq('id', params.id).single();
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
