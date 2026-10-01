'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/lib/utils';
import type { Order, Business } from '@/lib/types';
import toast from 'react-hot-toast';
import {
  MapPinIcon,
  TruckIcon,
  BuildingStorefrontIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';

type AvailableOrder = Order & { business: Business; customer: { full_name: string; address: string | null } };

export default function AvailableDeliveries() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [orders, setOrders] = useState<AvailableOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, business:businesses(*), customer:profiles!orders_customer_id_fkey(full_name, address)')
      .eq('status', 'ready_for_pickup')
      .is('rider_id', null)
      .order('created_at', { ascending: false });
    setOrders((data as any) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    const channel = supabase
      .channel('available-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: 'status=eq.ready_for_pickup' }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchOrders]);

  const acceptDelivery = async (orderId: string) => {
    if (!profile) return;
    setAccepting(orderId);
    const { error } = await supabase.from('orders').update({
      rider_id: profile.id,
      status: 'rider_assigned',
    }).eq('id', orderId).is('rider_id', null);

    if (error) {
      toast.error('Failed to accept — another rider may have taken it');
      setAccepting(null);
      fetchOrders();
      return;
    }
    toast.success('Delivery accepted! Head to the pickup location.');
    setAccepting(null);
    fetchOrders();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        {[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Available Deliveries</h1>
        <p className="text-sm text-slate-500 mt-1">Orders ready for pickup — accept to start delivering</p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={<TruckIcon className="h-16 w-16" />}
          title="No deliveries available"
          description="Check back soon — new orders appear in real time."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map(order => (
            <Card key={order.id} className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">{order.order_number}</p>
                  <Badge variant="info" className="mt-1">Ready for Pickup</Badge>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">{formatCurrency(Number(order.delivery_fee))}</p>
                  <p className="text-xs text-slate-500">delivery fee</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <BuildingStorefrontIcon className="h-4 w-4 text-brand-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Pickup from</p>
                    <p className="text-sm font-medium">{(order.business as any)?.name}</p>
                    <p className="text-xs text-slate-500">{(order.business as any)?.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPinIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Deliver to</p>
                    <p className="text-sm font-medium">{(order.customer as any)?.full_name}</p>
                    <p className="text-xs text-slate-500">{order.delivery_address}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <ShoppingBagIcon className="h-4 w-4" />
                  <span>Order total: {formatCurrency(Number(order.total))}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <CurrencyDollarIcon className="h-4 w-4" />
                  <span className="capitalize">{order.payment_mode}</span>
                </div>
              </div>

              <Button className="w-full" onClick={() => acceptDelivery(order.id)} loading={accepting === order.id}>
                Accept Delivery
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
