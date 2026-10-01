'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency, getOrderStatusLabel, cn } from '@/lib/utils';
import type { Order, Business } from '@/lib/types';
import toast from 'react-hot-toast';
import {
  MapPinIcon,
  TruckIcon,
  PhoneIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

type ActiveOrder = Order & { business: Business; customer: { full_name: string; phone: string | null; address: string | null } };

const STEPS = [
  { status: 'rider_assigned', label: 'Assigned', action: 'picked_up', actionLabel: 'Picked Up' },
  { status: 'picked_up', label: 'Picked Up', action: 'on_the_way', actionLabel: 'On the Way' },
  { status: 'on_the_way', label: 'On the Way', action: 'delivered', actionLabel: 'Delivered' },
  { status: 'delivered', label: 'Delivered', action: null, actionLabel: null },
];

export default function ActiveDelivery() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [order, setOrder] = useState<ActiveOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchActive = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('orders')
      .select('*, business:businesses(*), customer:profiles!orders_customer_id_fkey(full_name, phone, address)')
      .eq('rider_id', profile.id)
      .in('status', ['rider_assigned', 'picked_up', 'on_the_way'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    setOrder(data as any);
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => { fetchActive(); }, [fetchActive]);

  const updateStatus = async (newStatus: string) => {
    if (!order) return;
    setUpdating(true);
    const payload: Record<string, any> = { status: newStatus };
    if (newStatus === 'picked_up') payload.picked_up_at = new Date().toISOString();
    if (newStatus === 'delivered') payload.delivered_at = new Date().toISOString();

    const { error } = await supabase.from('orders').update(payload).eq('id', order.id);
    if (error) { toast.error('Failed to update status'); setUpdating(false); return; }

    if (newStatus === 'delivered') {
      await supabase.from('rider_profiles').update({
        total_deliveries: (await supabase.from('rider_profiles').select('total_deliveries').eq('user_id', profile!.id).single()).data?.total_deliveries + 1 || 1,
      }).eq('user_id', profile!.id);
    }

    toast.success(`Status updated to ${getOrderStatusLabel(newStatus)}`);
    setUpdating(false);
    fetchActive();
  };

  if (loading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 rounded-2xl" /></div>;

  if (!order) {
    return (
      <EmptyState
        icon={<TruckIcon className="h-16 w-16" />}
        title="No active delivery"
        description="Accept a delivery from the available orders to get started."
      />
    );
  }

  const currentStepIndex = STEPS.findIndex(s => s.status === order.status);
  const nextStep = STEPS[currentStepIndex];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Active Delivery</h1>
        <p className="text-sm text-slate-500 mt-1">Order {order.order_number}</p>
      </div>

      {/* Progress */}
      <Card>
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Delivery Progress</h2>
        <div className="flex items-center justify-between mb-6">
          {STEPS.map((step, i) => {
            const done = i < currentStepIndex || (i === currentStepIndex && order.status === 'delivered');
            const active = i === currentStepIndex;
            return (
              <div key={step.status} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                    done ? 'bg-green-500 text-white' : active ? 'bg-brand-500 text-white animate-pulse-soft' : 'bg-slate-200 text-slate-500'
                  )}>
                    {done ? <CheckCircleIcon className="h-5 w-5" /> : i + 1}
                  </div>
                  <span className={cn('text-xs mt-1.5 text-center', active ? 'text-brand-600 font-medium' : 'text-slate-500')}>{step.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn('flex-1 h-0.5 mx-2', i < currentStepIndex ? 'bg-green-500' : 'bg-slate-200')} />
                )}
              </div>
            );
          })}
        </div>

        {nextStep?.action && (
          <Button className="w-full" onClick={() => updateStatus(nextStep.action!)} loading={updating} size="lg">
            <ArrowRightIcon className="h-5 w-5" /> Mark as {nextStep.actionLabel}
          </Button>
        )}
      </Card>

      {/* Locations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-50 flex items-center justify-center">
              <MapPinIcon className="h-4 w-4 text-brand-600" />
            </div>
            <p className="text-xs text-slate-500">Pickup Location</p>
          </div>
          <p className="text-sm font-semibold">{(order.business as any)?.name}</p>
          <p className="text-xs text-slate-500">{(order.business as any)?.address}</p>
          {(order.business as any)?.phone && (
            <a href={`tel:${(order.business as any).phone}`} className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline">
              <PhoneIcon className="h-3.5 w-3.5" /> Call Business
            </a>
          )}
        </Card>
        <Card className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
              <MapPinIcon className="h-4 w-4 text-red-600" />
            </div>
            <p className="text-xs text-slate-500">Delivery Location</p>
          </div>
          <p className="text-sm font-semibold">{(order.customer as any)?.full_name}</p>
          <p className="text-xs text-slate-500">{order.delivery_address}</p>
          {(order.customer as any)?.phone && (
            <a href={`tel:${(order.customer as any).phone}`} className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline">
              <PhoneIcon className="h-3.5 w-3.5" /> Call Customer
            </a>
          )}
        </Card>
      </div>

      {/* Order summary */}
      <Card>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Order Summary</h2>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-slate-600">Payment Mode</span>
          <Badge variant="default" className="capitalize">{order.payment_mode}</Badge>
        </div>
        <div className="flex items-center justify-between py-2 border-t border-slate-100">
          <span className="text-sm text-slate-600">Order Total</span>
          <span className="text-sm font-semibold">{formatCurrency(Number(order.total))}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-t border-slate-100">
          <span className="text-sm text-slate-600">Delivery Fee (your earnings)</span>
          <span className="text-sm font-bold text-green-600">{formatCurrency(Number(order.delivery_fee))}</span>
        </div>
      </Card>
    </div>
  );
}
