'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { PageSkeleton } from '@/components/ui/skeleton';
import { formatRelativeTime, getApprovalStatusColor, getBusinessTypeLabel } from '@/lib/utils';
import {
  UsersIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  ShoppingBagIcon,
  ClockIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import type { Profile, Business } from '@/lib/types';

interface Stats {
  totalUsers: number;
  pendingUsers: number;
  totalBusinesses: number;
  pendingBusinesses: number;
  totalRiders: number;
  pendingRiders: number;
  totalOrders: number;
  activeOrders: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingUsers, setPendingUsers] = useState<Profile[]>([]);
  const [pendingBusinesses, setPendingBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const [
        { count: totalUsers },
        { count: pendingUserCount },
        { count: totalBusinesses },
        { count: pendingBizCount },
        { count: totalRiders },
        { count: pendingRiderCount },
        { count: totalOrders },
        { count: activeOrders },
        { data: pUsers },
        { data: pBiz },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('businesses').select('*', { count: 'exact', head: true }),
        supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'rider'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'rider').eq('status', 'pending'),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).not('status', 'in', '("delivered","cancelled")'),
        supabase.from('profiles').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
        supabase.from('businesses').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
      ]);

      setStats({
        totalUsers: totalUsers ?? 0,
        pendingUsers: pendingUserCount ?? 0,
        totalBusinesses: totalBusinesses ?? 0,
        pendingBusinesses: pendingBizCount ?? 0,
        totalRiders: totalRiders ?? 0,
        pendingRiders: pendingRiderCount ?? 0,
        totalOrders: totalOrders ?? 0,
        activeOrders: activeOrders ?? 0,
      });
      setPendingUsers(pUsers || []);
      setPendingBusinesses(pBiz || []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading || !stats) return <PageSkeleton />;

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: UsersIcon, href: '/dashboard/admin/users', color: 'text-blue-600 bg-blue-50' },
    { label: 'Pending Approvals', value: stats.pendingUsers + stats.pendingBusinesses + stats.pendingRiders, icon: ClockIcon, href: '/dashboard/admin/users', color: 'text-yellow-600 bg-yellow-50' },
    { label: 'Businesses', value: stats.totalBusinesses, icon: BuildingStorefrontIcon, href: '/dashboard/admin/businesses', color: 'text-purple-600 bg-purple-50' },
    { label: 'Riders', value: stats.totalRiders, icon: TruckIcon, href: '/dashboard/admin/riders', color: 'text-green-600 bg-green-50' },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBagIcon, href: '/dashboard/admin/orders', color: 'text-brand-600 bg-brand-50' },
    { label: 'Active Orders', value: stats.activeOrders, icon: CheckBadgeIcon, href: '/dashboard/admin/orders', color: 'text-teal-600 bg-teal-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Platform overview and management</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card hover className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${s.color}`}>
                <s.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{s.label}</p>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Users */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Pending Users</CardTitle>
            <Link href="/dashboard/admin/users" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
              View all
            </Link>
          </div>
          {pendingUsers.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No pending user approvals</p>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <Avatar src={u.avatar_url} name={u.full_name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{u.full_name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                  <Badge variant="warning">{u.role}</Badge>
                  <span className="text-xs text-slate-400">{formatRelativeTime(u.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Pending Businesses */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Pending Businesses</CardTitle>
            <Link href="/dashboard/admin/businesses" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
              View all
            </Link>
          </div>
          {pendingBusinesses.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No pending business approvals</p>
          ) : (
            <div className="space-y-3">
              {pendingBusinesses.map((b) => (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <Avatar src={b.logo_url} name={b.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{b.name}</p>
                    <p className="text-xs text-slate-500">{getBusinessTypeLabel(b.business_type)} &middot; {b.address}</p>
                  </div>
                  <Badge variant="warning">Pending</Badge>
                  <span className="text-xs text-slate-400">{formatRelativeTime(b.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
