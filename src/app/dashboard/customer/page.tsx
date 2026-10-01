'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { cn, formatCurrency, getBusinessTypeLabel } from '@/lib/utils';
import { BUSINESS_TYPES, BARANGAYS } from '@/lib/constants';
import { StarRating } from '@/components/ui/star-rating';
import { Badge } from '@/components/ui/badge';
import { CardSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import type { Business } from '@/lib/types';
import {
  MagnifyingGlassIcon,
  ClockIcon,
  CurrencyDollarIcon,
  BuildingStorefrontIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export default function CustomerDashboardPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filtered, setFiltered] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [barangayFilter, setBarangayFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
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
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q) ||
          b.address.toLowerCase().includes(q)
      );
    }
    if (typeFilter) result = result.filter((b) => b.business_type === typeFilter);
    if (barangayFilter) result = result.filter((b) => b.barangay === barangayFilter);
    setFiltered(result);
  }, [search, typeFilter, barangayFilter, businesses]);

  const activeFilterCount = [typeFilter, barangayFilter].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Browse Eateries & Shops</h1>
        <p className="text-slate-500 mt-1">Discover local favorites in Jasaan</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search eateries, shops, or locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-11"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'btn-secondary relative',
            activeFilterCount > 0 && 'ring-brand-300 text-brand-700'
          )}
        >
          <FunnelIcon className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 animate-slide-down">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">Filters</h3>
            {activeFilterCount > 0 && (
              <button
                onClick={() => { setTypeFilter(''); setBarangayFilter(''); }}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label-field">Business Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input-field"
              >
                <option value="">All Types</option>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Barangay</label>
              <select
                value={barangayFilter}
                onChange={(e) => setBarangayFilter(e.target.value)}
                className="input-field"
              >
                <option value="">All Barangays</option>
                {BARANGAYS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-slate-500">
          {filtered.length} {filtered.length === 1 ? 'result' : 'results'} found
        </p>
      )}

      {/* Business Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BuildingStorefrontIcon className="h-16 w-16" />}
          title="No results found"
          description="Try adjusting your search or filters to find what you're looking for."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((business) => (
            <Link
              key={business.id}
              href={`/browse/${business.slug}`}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm card-hover"
            >
              {/* Cover Image */}
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
                {/* Open/Closed badge */}
                <div className="absolute top-3 right-3">
                  <Badge variant={business.is_open ? 'success' : 'default'} size="md">
                    {business.is_open ? 'Open' : 'Closed'}
                  </Badge>
                </div>
                {/* Logo */}
                {business.logo_url && (
                  <div className="absolute -bottom-5 left-4 h-12 w-12 rounded-xl border-2 border-white overflow-hidden shadow-md bg-white">
                    <Image src={business.logo_url} alt="" fill className="object-cover" />
                  </div>
                )}
              </div>

              <div className="p-4 pt-8">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                      {business.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{business.address}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <Badge variant="info" size="sm">
                    {getBusinessTypeLabel(business.business_type)}
                  </Badge>
                  {business.barangay && (
                    <span className="text-xs text-slate-400">{business.barangay}</span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <StarRating rating={business.rating} size="sm" />
                    <span className="text-xs text-slate-500 ml-1">
                      ({business.total_ratings})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-3.5 w-3.5" />
                      {business.avg_prep_time_mins}min
                    </span>
                    {business.min_order_amount > 0 && (
                      <span className="flex items-center gap-1">
                        <CurrencyDollarIcon className="h-3.5 w-3.5" />
                        Min {formatCurrency(business.min_order_amount)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
