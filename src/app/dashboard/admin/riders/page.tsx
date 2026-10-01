'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { StarRating } from '@/components/ui/star-rating';
import { PageSkeleton } from '@/components/ui/skeleton';
import { formatDate, formatCurrency } from '@/lib/utils';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { Profile, UserDocument, RiderProfile } from '@/lib/types';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'suspended', label: 'Suspended' },
];

const statusBadgeVariant: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning', approved: 'success', rejected: 'danger', suspended: 'default',
};

interface RiderRow extends Profile {
  rider_profiles: RiderProfile[] | null;
}

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<RiderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<RiderRow | null>(null);
  const [docs, setDocs] = useState<UserDocument[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    let query = supabase.from('profiles').select('*, rider_profiles(*)').eq('role', 'rider').order('created_at', { ascending: false });
    if (statusFilter) query = query.eq('status', statusFilter);
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    const { data } = await query;
    setRiders((data as RiderRow[]) || []);
    setLoading(false);
  }, [supabase, statusFilter, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openDetail = async (rider: RiderRow) => {
    setSelected(rider);
    const { data } = await supabase.from('user_documents').select('*').eq('user_id', rider.id);
    setDocs(data || []);
  };

  const handleAction = async (status: 'approved' | 'rejected' | 'suspended') => {
    if (!selected) return;
    setActionLoading(true);
    const res = await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'user', id: selected.id, status }),
    });
    if (res.ok) {
      toast.success(`Rider ${status}`);
      setSelected({ ...selected, status });
      fetchData();
    } else {
      toast.error('Action failed');
    }
    setActionLoading(false);
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Rider Management</h1>
        <p className="text-sm text-slate-500 mt-1">Review and manage delivery riders</p>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1">
            <Input placeholder="Search riders..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<MagnifyingGlassIcon className="h-4 w-4" />} />
          </div>
          <Select options={statusOptions} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="px-4 py-3 font-medium text-slate-500">Rider</th>
                <th className="px-4 py-3 font-medium text-slate-500">Phone</th>
                <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 font-medium text-slate-500">Deliveries</th>
                <th className="px-4 py-3 font-medium text-slate-500">Rating</th>
                <th className="px-4 py-3 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {riders.map((rider) => {
                const rp = rider.rider_profiles?.[0];
                return (
                  <tr key={rider.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar src={rider.avatar_url} name={rider.full_name} size="sm" />
                        <div>
                          <p className="font-medium text-slate-900">{rider.full_name}</p>
                          <p className="text-xs text-slate-500">{rider.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{rider.phone || '—'}</td>
                    <td className="px-4 py-3"><Badge variant={statusBadgeVariant[rider.status] || 'default'}>{rider.status}</Badge></td>
                    <td className="px-4 py-3 text-slate-600">{rp?.total_deliveries ?? 0}</td>
                    <td className="px-4 py-3">{rp ? <StarRating rating={rp.rating} size="sm" showValue /> : '—'}</td>
                    <td className="px-4 py-3"><Button size="sm" variant="ghost" onClick={() => openDetail(rider)}>View</Button></td>
                  </tr>
                );
              })}
              {riders.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">No riders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Rider Details" size="lg">
        {selected && (() => {
          const rp = selected.rider_profiles?.[0];
          return (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar src={selected.avatar_url} name={selected.full_name} size="lg" />
                <div>
                  <h3 className="text-lg font-semibold">{selected.full_name}</h3>
                  <p className="text-sm text-slate-500">{selected.email}</p>
                  <Badge variant={statusBadgeVariant[selected.status] || 'default'}>{selected.status}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500">Phone:</span> <span className="font-medium">{selected.phone || '—'}</span></div>
                <div><span className="text-slate-500">Address:</span> <span className="font-medium">{selected.address || '—'}</span></div>
                <div><span className="text-slate-500">License:</span> <span className="font-medium">{rp?.license_number || '—'}</span></div>
                <div><span className="text-slate-500">Motorcycle:</span> <span className="font-medium">{rp?.motorcycle_model || '—'} ({rp?.motorcycle_plate || '—'})</span></div>
                <div><span className="text-slate-500">Deliveries:</span> <span className="font-medium">{rp?.total_deliveries ?? 0}</span></div>
                <div><span className="text-slate-500">Earnings:</span> <span className="font-medium">{formatCurrency(rp?.total_earnings ?? 0)}</span></div>
                <div><span className="text-slate-500">Rating:</span> <span className="font-medium">{rp?.rating ?? 0} ({rp?.total_ratings ?? 0} reviews)</span></div>
                <div><span className="text-slate-500">Joined:</span> <span className="font-medium">{formatDate(selected.created_at)}</span></div>
              </div>

              {docs.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Submitted Documents</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {docs.map((doc) => (
                      <div key={doc.id} className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="relative h-40 bg-slate-100">
                          <img src={doc.file_url} alt={doc.document_type} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-2 text-center">
                          <p className="text-xs font-medium text-slate-600 capitalize">{doc.document_type.replace(/_/g, ' ')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                {selected.status !== 'approved' && <Button onClick={() => handleAction('approved')} loading={actionLoading}>Approve</Button>}
                {selected.status !== 'rejected' && <Button variant="danger" onClick={() => handleAction('rejected')} loading={actionLoading}>Reject</Button>}
                {selected.status === 'approved' && <Button variant="secondary" onClick={() => handleAction('suspended')} loading={actionLoading}>Suspend</Button>}
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
