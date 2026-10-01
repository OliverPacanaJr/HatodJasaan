import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .single();

    if (!profile || profile.status !== 'approved') {
      return NextResponse.json({ error: 'Account not approved' }, { status: 403 });
    }

    const body = await request.json();
    const { business_id, items, delivery_address, delivery_lat, delivery_lng, payment_mode, notes } = body;

    if (!business_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Business ID and at least one item required' }, { status: 400 });
    }

    if (!delivery_address) {
      return NextResponse.json({ error: 'Delivery address required' }, { status: 400 });
    }

    const { data: business } = await supabase
      .from('businesses')
      .select('id, name, status, is_open, owner_id, min_order_amount')
      .eq('id', business_id)
      .single();

    if (!business || business.status !== 'approved') {
      return NextResponse.json({ error: 'Business not available' }, { status: 400 });
    }

    const menuItemIds = items.map((i: { menu_item_id: string }) => i.menu_item_id);
    const { data: menuItems } = await supabase
      .from('menu_items')
      .select('id, name, price, is_available')
      .in('id', menuItemIds)
      .eq('business_id', business_id);

    if (!menuItems || menuItems.length !== items.length) {
      return NextResponse.json({ error: 'Some menu items are invalid' }, { status: 400 });
    }

    const unavailable = menuItems.filter((mi) => !mi.is_available);
    if (unavailable.length > 0) {
      return NextResponse.json({ error: `Unavailable items: ${unavailable.map((u) => u.name).join(', ')}` }, { status: 400 });
    }

    let subtotal = 0;
    const orderItems = items.map((item: { menu_item_id: string; quantity: number; notes?: string }) => {
      const mi = menuItems.find((m) => m.id === item.menu_item_id)!;
      const totalPrice = mi.price * item.quantity;
      subtotal += totalPrice;
      return {
        menu_item_id: mi.id,
        item_name: mi.name,
        quantity: item.quantity,
        unit_price: mi.price,
        total_price: totalPrice,
        notes: item.notes || null,
      };
    });

    if (subtotal < business.min_order_amount) {
      return NextResponse.json({ error: `Minimum order is ₱${business.min_order_amount}` }, { status: 400 });
    }

    const baseFee = Number(process.env.NEXT_PUBLIC_BASE_DELIVERY_FEE) || 25;
    const delivery_fee = baseFee;
    const total = subtotal + delivery_fee;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: user.id,
        business_id,
        subtotal,
        delivery_fee,
        total,
        payment_mode: payment_mode || 'cash',
        delivery_address,
        delivery_lat: delivery_lat || null,
        delivery_lng: delivery_lng || null,
        customer_notes: notes || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    const itemsWithOrderId = orderItems.map((item: Record<string, unknown>) => ({ ...item, order_id: order.id }));
    await supabase.from('order_items').insert(itemsWithOrderId);

    await supabase.from('notifications').insert({
      user_id: business.owner_id,
      title: 'New Order!',
      body: `Order ${order.order_number} received — ₱${total.toFixed(0)}`,
      type: 'new_order',
      data: { order_id: order.id, order_number: order.order_number },
    });

    await supabase.from('businesses').update({ total_orders: business.min_order_amount + 1 }).eq('id', business_id);

    return NextResponse.json(order, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 100);

    let query = supabase
      .from('orders')
      .select('*, business:businesses(name, logo_url), order_items(*)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (profile?.role === 'admin') {
      // admin sees all
    } else if (profile?.role === 'rider') {
      query = query.eq('rider_id', user.id);
    } else if (profile?.role === 'business') {
      const { data: biz } = await supabase.from('businesses').select('id').eq('owner_id', user.id);
      const bizIds = biz?.map((b) => b.id) || [];
      if (bizIds.length > 0) query = query.in('business_id', bizIds);
      else return NextResponse.json([]);
    } else {
      query = query.eq('customer_id', user.id);
    }

    if (status) query = query.eq('status', status);

    const { data } = await query;
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
