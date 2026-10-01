'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Order, RiderProfile } from '@/lib/types';
import {
  BanknotesIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';

export default function RiderEarnings() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [riderProfile, setRiderProfile] = useState<RiderProfile | null>(null);
  const [recentDeliveries, setRecentDeliveries] = useState<(Order & { business: { name: string } })[]>([]);
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchEarnings = useCallback(async () => {
    if (!profile) return;

    const { data: rp } = await supabase.from('rider_profiles').select('*').eq('user_id', profile.id).single();
    setRiderProfile(rp);

    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data: delivered } = await supabase
      .from('orders')
      .select('delivery_fee, delivered_at, business:businesses(name)')
      .eq('rider_id', profile.id)
      .eq('status', 'delivered')
      .order('delivered_at', { ascending: false });

    const all = (delivered as any) || [];
    const todayEarnings = all.filter((o: any) => new Date(o.delivered_at) >= todayStart).reduce((s: number, o: any) => s + Number(o.delivery_fee), 0);
    const weekEarnings = all.filter((o: any) => new Date(o.delivered_at) >= weekStart).reduce((s: number, o: any) => s + Number(o.delivery_fee), 0);
    const monthEarnings = all.filter((o: any) => new Date(o.delivered_at) >= monthStart).reduce((s: number, o: any) => s + Number(o.delivery_fee), 0);
    const totalEarnings = all.reduce((s: number, o: any) => s + Number(o.delivery_fee), 0);

    setStats({ today: todayEarnings, week: weekEarnings, month: monthEarnings, total: totalEarnings });
    setRecentDeliveries(all.slice(0, 20));
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => { fetchEarnings(); }, [fetchEarnings]);

  if (loading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-2 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Earnings</h1>
        <p className="text-sm text-slate-500 mt-1">Track your delivery earnings</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today", value: stats.today, icon: BanknotesIcon, color: 'text-green-600 bg-green-50' },
          { label: "This Week", value: stats.week, icon: CalendarIcon, color: 'text-blue-600 bg-blue-50' },
          { label: "This Month", value: stats.month, icon: ArrowTrendingUpIcon, color: 'text-purple-600 bg-purple-50' },
          { label: "All Time", value: stats.total, icon: TruckIcon, color: 'text-brand-600 bg-brand-50' },
        ].map(stat => (
          <Card key={stat.label}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <span className="text-xs text-slate-500">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(stat.value)}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Deliveries</h2>
        {recentDeliveries.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No deliveries yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentDeliveries.map(d => (
              <div key={d.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{(d.business as any)?.name}</p>
                  <p className="text-xs text-slate-500">{formatDate(d.delivered_at!)}</p>
                </div>
                <span className="text-sm font-bold text-green-600">+{formatCurrency(Number(d.delivery_fee))}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
