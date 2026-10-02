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
import { formatDate, getBusinessTypeLabel } from '@/lib/utils';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { BUSINESS_TYPES } from '@/lib/constants';
import type { Business, BusinessDocument, Profile } from '@/lib/types';
import toast from 'react-hot-toast';
import { SecureDocImage } from '@/components/ui/secure-doc-image';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'suspended', label: 'Suspended' },
];
const typeOptions = [{ value: '', label: 'All Types' }, ...BUSINESS_TYPES.map((t) => ({ value: t.value, label: t.label }))];

const statusBadgeVariant: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning', approved: 'success', rejected: 'danger', suspended: 'default',
};

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selected, setSelected] = useState<Business | null>(null);
  const [docs, setDocs] = useState<BusinessDocument[]>([]);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    let query = supabase.from('businesses').select('*').order('created_at', { ascending: false });
    if (statusFilter) query = query.eq('status', statusFilter);
    if (typeFilter) query = query.eq('business_type', typeFilter);
    if (search) query = query.ilike('name', `%${search}%`);
    const { data } = await query;
    setBusinesses(data || []);
    setLoading(false);
  }, [supabase, statusFilter, typeFilter, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openDetail = async (biz: Business) => {
    setSelected(biz);
    const [{ data: d }, { data: o }] = await Promise.all([
      supabase.from('business_documents').select('*').eq('business_id', biz.id),
      supabase.from('profiles').select('*').eq('id', biz.owner_id).single(),
    ]);
    setDocs(d || []);
    setOwner(o);
  };

  const handleAction = async (status: 'approved' | 'rejected' | 'suspended') => {
    if (!selected) return;
    setActionLoading(true);
    const res = await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'business', id: selected.id, status }),
    });
    if (res.ok) {
      toast.success(`Business ${status}`);
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
        <h1 className="text-2xl font-bold text-slate-900">Business Management</h1>
        <p className="text-sm text-slate-500 mt-1">Review and manage registered businesses</p>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1">
            <Input placeholder="Search business name..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<MagnifyingGlassIcon className="h-4 w-4" />} />
          </div>
          <Select options={typeOptions} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} />
          <Select options={statusOptions} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="px-4 py-3 font-medium text-slate-500">Business</th>
                <th className="px-4 py-3 font-medium text-slate-500">Type</th>
                <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 font-medium text-slate-500">Rating</th>
                <th className="px-4 py-3 font-medium text-slate-500">Orders</th>
                <th className="px-4 py-3 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((biz) => (
                <tr key={biz.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar src={biz.logo_url} name={biz.name} size="sm" />
                      <div>
                        <p className="font-medium text-slate-900">{biz.name}</p>
                        <p className="text-xs text-slate-500">{biz.address}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{getBusinessTypeLabel(biz.business_type)}</td>
                  <td className="px-4 py-3"><Badge variant={statusBadgeVariant[biz.status] || 'default'}>{biz.status}</Badge></td>
                  <td className="px-4 py-3"><StarRating rating={biz.rating} size="sm" showValue /></td>
                  <td className="px-4 py-3 text-slate-600">{biz.total_orders}</td>
                  <td className="px-4 py-3"><Button size="sm" variant="ghost" onClick={() => openDetail(biz)}>View</Button></td>
                </tr>
              ))}
              {businesses.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">No businesses found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Business Details" size="lg">
        {selected && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar src={selected.logo_url} name={selected.name} size="lg" />
              <div>
                <h3 className="text-lg font-semibold">{selected.name}</h3>
                <p className="text-sm text-slate-500">{getBusinessTypeLabel(selected.business_type)} &middot; {selected.address}</p>
                <Badge variant={statusBadgeVariant[selected.status] || 'default'}>{selected.status}</Badge>
              </div>
            </div>

            {owner && (
              <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-3">
                <Avatar src={owner.avatar_url} name={owner.full_name} size="sm" />
                <div>
                  <p className="text-sm font-medium">Owner: {owner.full_name}</p>
                  <p className="text-xs text-slate-500">{owner.email} &middot; {owner.phone || 'No phone'}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Phone:</span> <span className="font-medium">{selected.phone || '—'}</span></div>
              <div><span className="text-slate-500">Email:</span> <span className="font-medium">{selected.email || '—'}</span></div>
              <div><span className="text-slate-500">Hours:</span> <span className="font-medium">{selected.opening_time} – {selected.closing_time}</span></div>
              <div><span className="text-slate-500">Min Order:</span> <span className="font-medium">₱{selected.min_order_amount}</span></div>
              <div><span className="text-slate-500">Rating:</span> <span className="font-medium">{selected.rating} ({selected.total_ratings} reviews)</span></div>
              <div><span className="text-slate-500">Total Orders:</span> <span className="font-medium">{selected.total_orders}</span></div>
              <div><span className="text-slate-500">Payment:</span> <span className="font-medium">{selected.payment_modes.join(', ')}</span></div>
              <div><span className="text-slate-500">Registered:</span> <span className="font-medium">{formatDate(selected.created_at)}</span></div>
            </div>

            {selected.description && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-1">Description</h4>
                <p className="text-sm text-slate-600">{selected.description}</p>
              </div>
            )}

            {docs.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Documents</h4>
                <div className="grid grid-cols-2 gap-3">
                  {docs.map((doc) => (
                    <div key={doc.id} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="relative h-40 bg-slate-100">
                        <SecureDocImage url={doc.file_url} alt={doc.document_type} className="w-full h-full object-cover" />
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
              {selected.status !== 'approved' && (
                <Button onClick={() => handleAction('approved')} loading={actionLoading}>Approve</Button>
              )}
              {selected.status !== 'rejected' && (
                <Button variant="danger" onClick={() => handleAction('rejected')} loading={actionLoading}>Reject</Button>
              )}
              {selected.status === 'approved' && (
                <Button variant="secondary" onClick={() => handleAction('suspended')} loading={actionLoading}>Suspend</Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
