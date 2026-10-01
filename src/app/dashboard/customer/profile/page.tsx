'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/auth-provider';
import { useNotifications } from '@/hooks/use-notifications';
import { cn, formatRelativeTime, getApprovalStatusColor } from '@/lib/utils';
import { BARANGAYS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { FileUpload } from '@/components/ui/file-upload';
import { PageSkeleton } from '@/components/ui/skeleton';
import type { Profile, UserDocument, Notification } from '@/lib/types';
import toast from 'react-hot-toast';
import {
  BellIcon,
  CheckCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

export default function CustomerProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user?.id);
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    barangay: '',
  });
  const supabase = createClient();

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        barangay: profile.barangay || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    async function fetchDocs() {
      const { data } = await supabase
        .from('user_documents')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      setDocuments(data || []);
      setLoading(false);
    }
    fetchDocs();
  }, [user, supabase]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update(form)
      .eq('id', user.id);
    if (error) {
      toast.error('Failed to save profile');
    } else {
      toast.success('Profile updated');
      refreshProfile();
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });
    if (uploadError) {
      toast.error('Failed to upload avatar');
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
    toast.success('Avatar updated');
    refreshProfile();
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 mt-1">Manage your account information</p>
      </div>

      {/* Status */}
      {profile && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">Account Status:</span>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getApprovalStatusColor(profile.status)}`}>
            {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
          </span>
        </div>
      )}

      {/* Avatar & Info */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="flex flex-col items-center gap-3">
            <Avatar src={profile?.avatar_url} name={profile?.full_name || 'User'} size="xl" />
            <label className="text-sm text-brand-600 hover:text-brand-700 font-medium cursor-pointer">
              Change Photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleAvatarUpload(e.target.files[0]);
                }}
              />
            </label>
          </div>

          <div className="flex-1 w-full space-y-4">
            <Input
              label="Full Name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
            <Input
              label="Email"
              value={profile?.email || ''}
              disabled
              className="bg-slate-50"
            />
            <Input
              label="Phone Number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="09XX-XXX-XXXX"
            />
            <Input
              label="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Your complete address"
            />
            <div>
              <label className="label-field">Barangay</label>
              <select
                value={form.barangay}
                onChange={(e) => setForm({ ...form, barangay: e.target.value })}
                className="input-field"
              >
                <option value="">Select Barangay</option>
                {BARANGAYS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <Button onClick={handleSave} loading={saving}>
              Save Changes
            </Button>
          </div>
        </div>
      </Card>

      {/* Documents */}
      <Card>
        <CardTitle>Submitted Documents</CardTitle>
        {documents.length === 0 ? (
          <p className="text-sm text-slate-500 mt-2">No documents uploaded yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
              >
                <DocumentTextIcon className="h-8 w-8 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 capitalize">
                    {doc.document_type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-slate-400">{doc.file_name}</p>
                </div>
                {doc.verified ? (
                  <Badge variant="success">Verified</Badge>
                ) : (
                  <Badge variant="warning">Pending</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Notifications */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CardTitle>Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="danger" size="md">{unreadCount} new</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <BellIcon className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.read && markAsRead(n.id)}
                className={cn(
                  'w-full text-left p-3 rounded-xl transition-colors',
                  n.read ? 'bg-white' : 'bg-brand-50 hover:bg-brand-100'
                )}
              >
                <div className="flex items-start gap-2">
                  {!n.read && (
                    <div className="h-2 w-2 mt-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(n.created_at)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
