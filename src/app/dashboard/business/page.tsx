'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency, formatRelativeTime, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils';
import type { Business, Order } from '@/lib/types';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ShoppingBagIcon,
  ClockIcon,
  CurrencyDollarIcon,
  StarIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';

export default function BusinessDashboard() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [business, setBusiness] = useState<Business | null>(null);
  const [recentOrders, setRecentOrders] = useState<(Order & { customer: { full_name: string } })[]>([]);
  const [weeklyOrders, setWeeklyOrders] = useState<{ day: string; count: number }[]>([]);
  const [stats, setStats] = useState({ todayOrders: 0, pendingOrders: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!profile) return;
    const { data: biz } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', profile.id)
      .single();
    if (!biz) { setLoading(false); return; }
    setBusiness(biz);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [ordersRes, pendingRes, revenueRes, recentRes] = await Promise.all([
      supabase.from('orders').select('id', { count: 'exact', head: true })
        .eq('business_id', biz.id).gte('created_at', todayStart.toISOString()),
      supabase.from('orders').select('id', { count: 'exact', head: true })
        .eq('business_id', biz.id).eq('status', 'pending'),
      supabase.from('orders').select('total').eq('business_id', biz.id).eq('status', 'delivered'),
      supabase.from('orders').select('*, customer:profiles!orders_customer_id_fkey(full_name)')
        .eq('business_id', biz.id).order('created_at', { ascending: false }).limit(10),
    ]);

    const totalRev = (revenueRes.data || []).reduce((s, o) => s + Number(o.total), 0);
    setStats({
      todayOrders: ordersRes.count || 0,
      pendingOrders: pendingRes.count || 0,
      totalRevenue: totalRev,
    });
    setRecentOrders((recentRes.data as any) || []);

    const days: { day: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setHours(23, 59, 59, 999);
      const { count } = await supabase.from('orders').select('id', { count: 'exact', head: true })
        .eq('business_id', biz.id).gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
      days.push({ day: d.toLocaleDateString('en', { weekday: 'short' }), count: count || 0 });
    }
    setWeeklyOrders(days);
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleOpen = async () => {
    if (!business) return;
    const { error } = await supabase.from('businesses').update({ is_open: !business.is_open }).eq('id', business.id);
    if (error) { toast.error('Failed to update status'); return; }
    setBusiness({ ...business, is_open: !business.is_open });
    toast.success(business.is_open ? 'Store marked as closed' : 'Store marked as open');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!business) {
    return (
      <EmptyState
        icon={<BuildingStorefrontIcon className="h-16 w-16" />}
        title="No business registered"
        description="You haven't registered a business yet."
        action={<Link href="/auth/register/business"><Button>Register Business</Button></Link>}
      />
    );
  }

  const maxOrders = Math.max(...weeklyOrders.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{business.name}</h1>
          <p className="text-sm text-slate-500 mt-1">Welcome back! Here&apos;s your business overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant={business.is_open ? 'primary' : 'secondary'} size="sm" onClick={toggleOpen}>
            {business.is_open ? '🟢 Open' : '🔴 Closed'}
          </Button>
          <Link href="/dashboard/business/menu">
            <Button variant="outline" size="sm">
              <BookOpenIcon className="h-4 w-4" /> Manage Menu
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Orders", value: stats.todayOrders, icon: ShoppingBagIcon, color: 'text-blue-600 bg-blue-50' },
          { label: 'Pending Orders', value: stats.pendingOrders, icon: ClockIcon, color: 'text-yellow-600 bg-yellow-50' },
          { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: CurrencyDollarIcon, color: 'text-green-600 bg-green-50' },
          { label: 'Average Rating', value: business.rating ? Number(business.rating).toFixed(1) : 'N/A', icon: StarIcon, color: 'text-orange-600 bg-orange-50' },
        ].map(stat => (
          <Card key={stat.label} className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Weekly chart */}
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Orders This Week</h2>
        <div className="flex items-end gap-2 h-40">
          {weeklyOrders.map(d => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-medium text-slate-600">{d.count}</span>
              <div
                className="w-full bg-brand-400 rounded-t-lg transition-all duration-500 min-h-[4px]"
                style={{ height: `${(d.count / maxOrders) * 100}%` }}
              />
              <span className="text-xs text-slate-500">{d.day}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent orders */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
          <Link href="/dashboard/business/orders" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            View All
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-slate-500 py-8 text-center">No orders yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{order.order_number}</p>
                  <p className="text-xs text-slate-500">{(order.customer as any)?.full_name} · {formatRelativeTime(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900">{formatCurrency(Number(order.total))}</span>
                  <Badge variant={order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'danger' : 'warning'}>
                    {getOrderStatusLabel(order.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function BuildingStorefrontIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
    </svg>
  );
}
