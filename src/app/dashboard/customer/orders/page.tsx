'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/auth-provider';
import {
  formatCurrency,
  formatDateTime,
  getOrderStatusLabel,
  getOrderStatusColor,
} from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSkeleton } from '@/components/ui/skeleton';
import type { Order, OrderItem, Business } from '@/lib/types';
import {
  ShoppingBagIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface OrderWithBusiness extends Order {
  businesses: Pick<Business, 'name' | 'slug'>;
  order_items: OrderItem[];
}

export default function CustomerOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    async function fetch() {
      let query = supabase
        .from('orders')
        .select('*, businesses(name, slug), order_items(*)')
        .eq('customer_id', user!.id)
        .order('created_at', { ascending: false });

      if (statusFilter) query = query.eq('status', statusFilter);

      const { data } = await query;
      setOrders((data as unknown as OrderWithBusiness[]) || []);
      setLoading(false);
    }
    fetch();
  }, [user, supabase, statusFilter]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
          <p className="text-slate-500 mt-1">Track and manage your orders</p>
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-auto text-sm py-2"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="ready_for_pickup">Ready for Pickup</option>
            <option value="on_the_way">On the Way</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBagIcon className="h-16 w-16" />}
          title="No orders yet"
          description="Start browsing eateries and shops to place your first order!"
          action={
            <Link href="/dashboard/customer" className="btn-primary">
              Browse Eateries
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const expanded = expandedId === order.id;
            return (
              <Card key={order.id} padding="none" className="overflow-hidden">
                <button
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                  className="w-full p-4 sm:p-5 flex items-center gap-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900 text-sm">
                        {order.order_number}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(
                          order.status
                        )}`}
                      >
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{order.businesses?.name}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatDateTime(order.created_at)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-slate-900">{formatCurrency(order.total)}</p>
                    <p className="text-xs text-slate-400">
                      {order.order_items?.length || 0} item(s)
                    </p>
                  </div>
                  {expanded ? (
                    <ChevronUpIcon className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  )}
                </button>

                {expanded && (
                  <div className="border-t border-slate-100 bg-slate-50 p-4 sm:p-5 animate-slide-down">
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-700">Order Items</h4>
                      <div className="space-y-2">
                        {order.order_items?.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <div>
                              <span className="text-slate-700">{item.item_name}</span>
                              <span className="text-slate-400 ml-2">x{item.quantity}</span>
                            </div>
                            <span className="text-slate-600 font-medium">
                              {formatCurrency(item.total_price)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-slate-200 pt-3 space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Subtotal</span>
                          <span className="text-slate-700">{formatCurrency(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Delivery Fee</span>
                          <span className="text-slate-700">
                            {formatCurrency(order.delivery_fee)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold">
                          <span className="text-slate-900">Total</span>
                          <span className="text-slate-900">{formatCurrency(order.total)}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        <Badge variant="default">
                          Payment: {order.payment_mode.toUpperCase()}
                        </Badge>
                        <Link
                          href={`/order/${order.id}`}
                          className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                        >
                          View Details &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
