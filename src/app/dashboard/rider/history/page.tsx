'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { StarRating } from '@/components/ui/star-rating';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Order } from '@/lib/types';
import { ClockIcon } from '@heroicons/react/24/outline';

type HistoryOrder = Order & {
  business: { name: string };
  customer: { full_name: string };
  review: { rider_rating: number | null } | null;
};

export default function RiderHistory() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  const fetchHistory = useCallback(async (pageNum: number) => {
    if (!profile) return;
    const { data } = await supabase
      .from('orders')
      .select('*, business:businesses(name), customer:profiles!orders_customer_id_fkey(full_name), review:reviews(rider_rating)')
      .eq('rider_id', profile.id)
      .eq('status', 'delivered')
      .order('delivered_at', { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);
    const results = (data as any) || [];
    if (pageNum === 0) setOrders(results);
    else setOrders(prev => [...prev, ...results]);
    setHasMore(results.length === PAGE_SIZE);
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => { fetchHistory(0); }, [fetchHistory]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchHistory(next);
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" />{[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Delivery History</h1>
        <p className="text-sm text-slate-500 mt-1">{orders.length} completed deliveries</p>
      </div>

      {orders.length === 0 ? (
        <EmptyState icon={<ClockIcon className="h-16 w-16" />} title="No delivery history" description="Completed deliveries will appear here." />
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <Card key={order.id} className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{order.order_number}</p>
                <p className="text-xs text-slate-500">{(order.business as any)?.name} → {(order.customer as any)?.full_name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{formatDate(order.delivered_at!)}</p>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="text-sm font-bold text-green-600">{formatCurrency(Number(order.delivery_fee))}</p>
                {(order.review as any)?.rider_rating && (
                  <StarRating rating={(order.review as any).rider_rating} size="sm" />
                )}
              </div>
            </Card>
          ))}
          {hasMore && (
            <div className="text-center pt-4">
              <button onClick={loadMore} className="text-sm text-brand-600 hover:text-brand-700 font-medium">Load More</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
