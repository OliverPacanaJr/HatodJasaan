import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { order_id, business_rating, rider_rating, comment } = body;

    if (!order_id || !business_rating) {
      return NextResponse.json({ error: 'order_id and business_rating are required' }, { status: 400 });
    }

    if (business_rating < 1 || business_rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    if (rider_rating !== undefined && rider_rating !== null && (rider_rating < 1 || rider_rating > 5)) {
      return NextResponse.json({ error: 'Rider rating must be between 1 and 5' }, { status: 400 });
    }

    const { data: order } = await supabase
      .from('orders')
      .select('id, customer_id, business_id, rider_id, status')
      .eq('id', order_id)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.customer_id !== user.id) {
      return NextResponse.json({ error: 'You can only review your own orders' }, { status: 403 });
    }

    if (order.status !== 'delivered') {
      return NextResponse.json({ error: 'Can only review delivered orders' }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('order_id', order_id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'You already reviewed this order' }, { status: 409 });
    }

    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        order_id,
        customer_id: user.id,
        business_id: order.business_id,
        rider_id: order.rider_id,
        business_rating,
        rider_rating: rider_rating || null,
        comment: comment || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(review, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
