'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, getBusinessTypeLabel } from '@/lib/utils';
import { BUSINESS_TYPES, BARANGAYS, APP_TAGLINE } from '@/lib/constants';
import { StarRating } from '@/components/ui/star-rating';
import { Badge } from '@/components/ui/badge';
import { CardSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import type { Business } from '@/lib/types';
import {
  MagnifyingGlassIcon,
  ClockIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  UserPlusIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export default function PublicBrowsePage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filtered, setFiltered] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('businesses')
        .select('*')
        .eq('status', 'approved')
        .order('is_open', { ascending: false })
        .order('rating', { ascending: false });
      setBusinesses(data || []);
      setFiltered(data || []);
      setLoading(false);
    }
    fetch();
  }, [supabase]);

  useEffect(() => {
    let result = businesses;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) => b.name.toLowerCase().includes(q) || b.address.toLowerCase().includes(q)
      );
    }
    if (typeFilter) result = result.filter((b) => b.business_type === typeFilter);
    setFiltered(result);
  }, [search, typeFilter, businesses]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl gradient-brand flex items-center justify-center">
              <TruckIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">HatodJasaan</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="btn-secondary text-sm py-2">
              Sign In
            </Link>
            <Link href="/auth/register" className="btn-primary text-sm py-2">
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero section */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            Discover Local Eateries & Shops
          </h1>
          <p className="text-slate-500 text-lg">{APP_TAGLINE}</p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search eateries, shops..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-11"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">All Types</option>
            {BUSINESS_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<BuildingStorefrontIcon className="h-16 w-16" />}
            title="No eateries found"
            description="Try adjusting your search or check back later."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((business) => (
              <Link
                key={business.id}
                href={`/browse/${business.slug}`}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm card-hover"
              >
                <div className="relative h-40 bg-gradient-to-br from-brand-100 to-brand-200">
                  {business.cover_url ? (
                    <Image
                      src={business.cover_url}
                      alt={business.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BuildingStorefrontIcon className="h-16 w-16 text-brand-300" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge variant={business.is_open ? 'success' : 'default'} size="md">
                      {business.is_open ? 'Open' : 'Closed'}
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                    {business.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{business.address}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="info" size="sm">
                      {getBusinessTypeLabel(business.business_type)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <StarRating rating={business.rating} size="sm" showValue />
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <ClockIcon className="h-3.5 w-3.5" />
                      {business.avg_prep_time_mins}min
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
