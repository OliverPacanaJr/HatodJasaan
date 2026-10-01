'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { PageSkeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDateTime, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils';
import { MagnifyingGlassIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import type { Order } from '@/lib/types';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready_for_pickup', label: 'Ready for Pickup' },
  { value: 'on_the_way', label: 'On the Way' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

interface OrderRow extends Order {
  business: { name: string } | null;
  customer: { full_name: string } | null;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const supabase = createClient();

  const fetchOrders = useCallback(async () => {
    let query = supabase
      .from('orders')
      .select('*, business:businesses(name), customer:profiles!orders_customer_id_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (statusFilter) query = query.eq('status', statusFilter);
    if (search) query = query.ilike('order_number', `%${search}%`);
    const { data } = await query;
    setOrders((data as OrderRow[]) || []);
    setLoading(false);
  }, [supabase, statusFilter, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const cancelOrder = async (orderId: string) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled', cancellation_reason: 'Cancelled by admin' }),
    });
    if (res.ok) {
      toast.success('Order cancelled');
      fetchOrders();
    } else {
      toast.error('Failed to cancel order');
    }
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">All Orders</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor all orders across the platform</p>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1">
            <Input placeholder="Search order number..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<MagnifyingGlassIcon className="h-4 w-4" />} />
          </div>
          <Select options={statusOptions} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="px-4 py-3 font-medium text-slate-500">Order #</th>
                <th className="px-4 py-3 font-medium text-slate-500">Customer</th>
                <th className="px-4 py-3 font-medium text-slate-500">Business</th>
                <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 font-medium text-slate-500">Total</th>
                <th className="px-4 py-3 font-medium text-slate-500">Date</th>
                <th className="px-4 py-3 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <>
                  <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">{order.order_number}</td>
                    <td className="px-4 py-3 text-slate-600">{order.customer?.full_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{order.business?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(order.total)}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDateTime(order.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
                          {expandedId === order.id ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                        </Button>
                        {!['delivered', 'cancelled'].includes(order.status) && (
                          <Button size="sm" variant="danger" onClick={() => cancelOrder(order.id)}>Cancel</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === order.id && (
                    <tr key={`${order.id}-detail`} className="bg-slate-50">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div><span className="text-slate-500">Subtotal:</span> <span className="font-medium">{formatCurrency(order.subtotal)}</span></div>
                          <div><span className="text-slate-500">Delivery:</span> <span className="font-medium">{formatCurrency(order.delivery_fee)}</span></div>
                          <div><span className="text-slate-500">Payment:</span> <span className="font-medium capitalize">{order.payment_mode}</span></div>
                          <div><span className="text-slate-500">Address:</span> <span className="font-medium">{order.delivery_address}</span></div>
                          {order.customer_notes && <div className="col-span-2"><span className="text-slate-500">Notes:</span> <span className="font-medium">{order.customer_notes}</span></div>}
                          {order.cancellation_reason && <div className="col-span-2"><span className="text-slate-500">Cancel reason:</span> <span className="font-medium text-red-600">{order.cancellation_reason}</span></div>}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">No orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
