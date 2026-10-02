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
import { PageSkeleton } from '@/components/ui/skeleton';
import { formatDate, getApprovalStatusColor } from '@/lib/utils';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { Profile, UserDocument } from '@/lib/types';
import toast from 'react-hot-toast';
import { SecureDocImage } from '@/components/ui/secure-doc-image';

const roleOptions = [
  { value: '', label: 'All Roles' },
  { value: 'customer', label: 'Customer' },
  { value: 'business', label: 'Business' },
  { value: 'rider', label: 'Rider' },
  { value: 'admin', label: 'Admin' },
];

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'suspended', label: 'Suspended' },
];

const statusBadgeVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  suspended: 'default',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [userDocs, setUserDocs] = useState<UserDocument[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const supabase = createClient();

  const fetchUsers = useCallback(async () => {
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (roleFilter) query = query.eq('role', roleFilter);
    if (statusFilter) query = query.eq('status', statusFilter);
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    const { data } = await query;
    setUsers(data || []);
    setLoading(false);
  }, [supabase, roleFilter, statusFilter, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openUserDetail = async (user: Profile) => {
    setSelectedUser(user);
    const { data } = await supabase.from('user_documents').select('*').eq('user_id', user.id);
    setUserDocs(data || []);
  };

  const handleAction = async (action: 'approved' | 'rejected' | 'suspended') => {
    if (!selectedUser) return;
    setActionLoading(true);
    const res = await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'user', id: selectedUser.id, status: action }),
    });
    if (res.ok) {
      toast.success(`User ${action}`);
      setSelectedUser({ ...selectedUser, status: action });
      fetchUsers();
    } else {
      const err = await res.json();
      toast.error(err.error || 'Action failed');
    }
    setActionLoading(false);
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-sm text-slate-500 mt-1">Review and manage all platform users</p>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<MagnifyingGlassIcon className="h-4 w-4" />}
            />
          </div>
          <Select options={roleOptions} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} />
          <Select options={statusOptions} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="px-4 py-3 font-medium text-slate-500">User</th>
                <th className="px-4 py-3 font-medium text-slate-500">Email</th>
                <th className="px-4 py-3 font-medium text-slate-500">Role</th>
                <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 font-medium text-slate-500">Joined</th>
                <th className="px-4 py-3 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar src={user.avatar_url} name={user.full_name} size="sm" />
                      <span className="font-medium text-slate-900">{user.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3"><Badge>{user.role}</Badge></td>
                  <td className="px-4 py-3">
                    <Badge variant={statusBadgeVariant[user.status] || 'default'}>{user.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="ghost" onClick={() => openUserDetail(user)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* User Detail Modal */}
      <Modal open={!!selectedUser} onClose={() => setSelectedUser(null)} title="User Details" size="lg">
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar src={selectedUser.avatar_url} name={selectedUser.full_name} size="lg" />
              <div>
                <h3 className="text-lg font-semibold">{selectedUser.full_name}</h3>
                <p className="text-sm text-slate-500">{selectedUser.email}</p>
                <div className="flex gap-2 mt-1">
                  <Badge>{selectedUser.role}</Badge>
                  <Badge variant={statusBadgeVariant[selectedUser.status] || 'default'}>{selectedUser.status}</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Phone:</span> <span className="font-medium">{selectedUser.phone || '—'}</span></div>
              <div><span className="text-slate-500">Address:</span> <span className="font-medium">{selectedUser.address || '—'}</span></div>
              <div><span className="text-slate-500">Barangay:</span> <span className="font-medium">{selectedUser.barangay || '—'}</span></div>
              <div><span className="text-slate-500">Joined:</span> <span className="font-medium">{formatDate(selectedUser.created_at)}</span></div>
            </div>

            {userDocs.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Submitted Documents</h4>
                <div className="grid grid-cols-2 gap-3">
                  {userDocs.map((doc) => (
                    <div key={doc.id} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="relative h-40 bg-slate-100">
                        <SecureDocImage url={doc.file_url} alt={doc.document_type} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-2 text-center">
                        <p className="text-xs font-medium text-slate-600 capitalize">
                          {doc.document_type.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              {selectedUser.status !== 'approved' && (
                <Button onClick={() => handleAction('approved')} loading={actionLoading}>Approve</Button>
              )}
              {selectedUser.status !== 'rejected' && (
                <Button variant="danger" onClick={() => handleAction('rejected')} loading={actionLoading}>Reject</Button>
              )}
              {selectedUser.status === 'approved' && (
                <Button variant="secondary" onClick={() => handleAction('suspended')} loading={actionLoading}>Suspend</Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
