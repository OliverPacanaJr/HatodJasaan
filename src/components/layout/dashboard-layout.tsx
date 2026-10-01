'use client';

import { useState, Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/auth-provider';
import { useNotifications } from '@/hooks/use-notifications';
import { NAV_ITEMS } from '@/lib/constants';
import type { UserRole } from '@/lib/types';
import {
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  UserIcon,
  BookOpenIcon,
  CogIcon,
  TruckIcon,
  MapPinIcon,
  ClockIcon,
  BanknotesIcon,
  UsersIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';

const iconMap: Record<string, React.ElementType> = {
  HomeIcon, MagnifyingGlassIcon, ShoppingBagIcon, UserIcon, BookOpenIcon,
  CogIcon, TruckIcon, MapPinIcon, ClockIcon, BanknotesIcon, UsersIcon,
  BuildingStorefrontIcon,
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const { unreadCount } = useNotifications(profile?.id);

  const role = (profile?.role || 'customer') as UserRole;
  const navItems = NAV_ITEMS[role] || NAV_ITEMS.customer;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
            <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center">
              <TruckIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">HatodJasaan</h1>
              <p className="text-xs text-slate-500 capitalize">{role} Dashboard</p>
            </div>
            <button className="ml-auto lg:hidden p-1" onClick={() => setSidebarOpen(false)}>
              <XMarkIcon className="h-5 w-5 text-slate-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = iconMap[item.icon] || HomeIcon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  <Icon className={cn('h-5 w-5', active ? 'text-brand-600' : 'text-slate-400')} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <Avatar src={profile?.avatar_url} name={profile?.full_name || 'User'} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{profile?.full_name}</p>
                <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-200">
          <div className="flex items-center gap-4 px-4 py-3 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>

            <div className="flex-1" />

            {/* Notifications */}
            <Link
              href={`/dashboard/${role}/profile`}
              className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <BellIcon className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* User avatar */}
            <Avatar src={profile?.avatar_url} name={profile?.full_name || 'User'} size="sm" />
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {profile?.status === 'pending' && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-sm text-yellow-800 font-medium">
                Your account is pending approval. Some features may be limited until an admin reviews your account.
              </p>
            </div>
          )}
          {profile?.status === 'rejected' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-800 font-medium">
                Your account application was not approved. Please contact support for more information.
              </p>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
