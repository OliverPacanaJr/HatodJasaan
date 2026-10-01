'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency, formatDateTime, getOrderStatusLabel, getOrderStatusColor, cn } from '@/lib/utils';
import type { Business, Order, OrderItem } from '@/lib/types';
import toast from 'react-hot-toast';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon,
  FireIcon,
  HandThumbUpIcon,
  ShoppingBagIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

type OrderWithDetails = Order & {
  customer: { full_name: string; phone: string | null };
  items: OrderItem[];
};

export default function BusinessOrders() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [business, setBusiness] = useState<Business | null>(null);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!profile) return;
    const { data: biz } = await supabase.from('businesses').select('*').eq('owner_id', profile.id).single();
    if (!biz) { setLoading(false); return; }
    setBusiness(biz);

    let query = supabase.from('orders')
      .select('*, customer:profiles!orders_customer_id_fkey(full_name, phone), items:order_items(*)')
      .eq('business_id', biz.id)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data } = await query.limit(100);
    setOrders((data as any) || []);
    setLoading(false);
  }, [profile, supabase, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    if (!business) return;
    const channel = supabase
      .channel('business-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `business_id=eq.${business.id}` }, () => { fetchOrders(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [business, supabase, fetchOrders]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    const updatePayload: Record<string, any> = { status: newStatus };
    if (newStatus === 'confirmed') updatePayload.confirmed_at = new Date().toISOString();
    if (newStatus === 'preparing') updatePayload.preparing_at = new Date().toISOString();
    if (newStatus === 'ready_for_pickup') updatePayload.ready_at = new Date().toISOString();

    const { error } = await supabase.from('orders').update(updatePayload).eq('id', orderId);
    if (error) { toast.error('Failed to update order'); setUpdating(null); return; }
    toast.success(`Order marked as ${getOrderStatusLabel(newStatus)}`);
    setUpdating(null);
    fetchOrders();
  };

  const statusOptions = ['all', 'pending', 'confirmed', 'preparing', 'ready_for_pickup', 'delivered', 'cancelled'];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-24 rounded-full" />)}</div>
        {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <p className="text-sm text-slate-500 mt-1">Manage incoming and active orders</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <FunnelIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
        {statusOptions.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={cn('px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors capitalize', statusFilter === s ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
            {s === 'all' ? 'All Orders' : getOrderStatusLabel(s)}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState icon={<ShoppingBagIcon className="h-16 w-16" />} title="No orders found" description={statusFilter !== 'all' ? 'No orders with this status.' : 'You have no orders yet.'} />
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <Card key={order.id} padding="none" className="overflow-hidden">
              <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)} className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{order.order_number}</p>
                    <p className="text-xs text-slate-500">{(order.customer as any)?.full_name} · {formatDateTime(order.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-bold text-slate-900">{formatCurrency(Number(order.total))}</span>
                  <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', getOrderStatusColor(order.status))}>{getOrderStatusLabel(order.status)}</span>
                  {expandedId === order.id ? <ChevronUpIcon className="h-4 w-4 text-slate-400" /> : <ChevronDownIcon className="h-4 w-4 text-slate-400" />}
                </div>
              </button>

              {expandedId === order.id && (
                <div className="px-5 pb-4 border-t border-slate-100 pt-4 animate-slide-down space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Customer</p>
                      <p className="text-sm font-medium">{(order.customer as any)?.full_name}</p>
                      {(order.customer as any)?.phone && <p className="text-xs text-slate-500">{(order.customer as any).phone}</p>}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Delivery Address</p>
                      <p className="text-sm">{order.delivery_address}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Order Items</p>
                    <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                      {(order.items || []).map(item => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span>{item.quantity}x {item.item_name}</span>
                          <span className="font-medium">{formatCurrency(Number(item.total_price))}</span>
                        </div>
                      ))}
                      <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between text-sm">
                        <span className="text-slate-500">Subtotal</span>
                        <span>{formatCurrency(Number(order.subtotal))}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Delivery Fee</span>
                        <span>{formatCurrency(Number(order.delivery_fee))}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold">
                        <span>Total</span>
                        <span>{formatCurrency(Number(order.total))}</span>
                      </div>
                    </div>
                  </div>
                  {order.customer_notes && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Customer Notes</p>
                      <p className="text-sm bg-yellow-50 p-2 rounded-lg">{order.customer_notes}</p>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    {order.status === 'pending' && (
                      <Button size="sm" onClick={() => updateStatus(order.id, 'confirmed')} loading={updating === order.id}>
                        <CheckIcon className="h-4 w-4" /> Confirm Order
                      </Button>
                    )}
                    {order.status === 'confirmed' && (
                      <Button size="sm" onClick={() => updateStatus(order.id, 'preparing')} loading={updating === order.id}>
                        <FireIcon className="h-4 w-4" /> Mark Preparing
                      </Button>
                    )}
                    {order.status === 'preparing' && (
                      <Button size="sm" onClick={() => updateStatus(order.id, 'ready_for_pickup')} loading={updating === order.id}>
                        <HandThumbUpIcon className="h-4 w-4" /> Mark Ready
                      </Button>
                    )}
                    {['pending', 'confirmed'].includes(order.status) && (
                      <Button size="sm" variant="danger" onClick={() => updateStatus(order.id, 'cancelled')} loading={updating === order.id}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
